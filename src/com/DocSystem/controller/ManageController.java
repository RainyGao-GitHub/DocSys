package com.DocSystem.controller;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.naming.ldap.LdapContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.redisson.config.SingleServerConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import util.DateFormat;
import util.ReadProperties;
import util.ReturnAjax;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.GroupMember;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.ReposMember;
import com.DocSystem.entity.UserGroup;

import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.Path;
import com.DocSystem.common.URLInfo;
import com.DocSystem.common.constants;
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.LDAPConfig;
import com.DocSystem.common.entity.QueryResult;
import com.DocSystem.common.entity.LongTermTask;
import com.DocSystem.controller.BaseController;

@Controller
@RequestMapping("/Manage")
public class ManageController extends BaseController{
	@Autowired
	private UserServiceImpl userService;

	@Autowired
	private ReposServiceImpl reposService;

	
	/********** 系统初始化 ***************/
	@RequestMapping("/docSysInit.do")
	public void docSysInit(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** docSysInit.do ***********************");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		Log.debug("docSysInit.do docSysInit() Start docSysInitState:" + docSysIniState);
		if(docSysIniState == 1)
		{
			Log.debug("docSysInit.do 用户自定义数据库配置文件与系统数据库配置文件不一致，等待重启生效！");
			rt.setData("needRestart");
			writeJson(rt, response);
			return;
		}
				
		String ret = docSysInit(true);
		switch(ret)
		{
		case "ok":
			docSysIniState = 0;
			break;
		case "needRestart":
			docSysIniState = 1;
			break;
		default:
			docSysIniState = -2;
			docSysErrorLog(ret, rt);
			break;
		}
		
		Log.debug("docSysInit.do docSysInit() End docSysInitState:" + docSysIniState);
		
		rt.setData(ret);
		writeJson(rt, response);
	}
	
	/********** 获取轮播图配置 ***************/
	@RequestMapping("/getBannerConfig.do")
	public void getBannerConfig(String serverIP, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getBannerConfig.do ***********************");

		Log.debug("getBannerConfig() serverIP:" + serverIP);
		collectDocSysInstallationInfo(serverIP, request);
		
		ReturnAjax rt = new ReturnAjax();

		//设置跨域访问允许
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
		
		String BannerConfigPath = docSysIniPath;
		if(FileUtil.isFileExist(BannerConfigPath + "bannerConfig.json") == false)
		{
			BannerConfigPath = docSysWebPath + "WEB-INF/classes/";
			if(FileUtil.isFileExist(BannerConfigPath + "bannerConfig.json") == false)
			{
				docSysErrorLog("bannerConfig.json文件不存在",rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		String s = FileUtil.readDocContentFromFile(BannerConfigPath, "bannerConfig.json");
		JSONObject jobj = JSON.parseObject(s);
		if(jobj == null)
		{
			docSysErrorLog("解析bannerConfig.json文件失败",rt);
			writeJson(rt, response);
			return;	
		}
		
		JSONArray list = jobj.getJSONArray("BannerConfigList");
		rt.setData(list);
		writeJson(rt, response);
	}

	/********** 获取系统邮件配置 ***************/
	@RequestMapping("/getSystemEmailConfig.do")
	public void getSystemEmailConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemEmailConfig.do ***********************");

		Log.debug("getSystemEmailConfig()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		
		String host = ReadProperties.read("docSysConfig.properties", "mail.smtp.host");
		if(host == null)
		{
			host = "";
		}
		String email = ReadProperties.read("docSysConfig.properties", "fromuser");
		if(email == null)
		{
			email = "";
		}
		String pwd = ReadProperties.read("docSysConfig.properties", "frompwd");
		if(pwd == null)
		{
			pwd = "";
		}
		
		JSONObject config = new JSONObject();
		config.put("host", host);
		config.put("email", email);
		config.put("pwd", pwd);
		rt.setData(config);
		writeJson(rt, response);
	}
	
	/********** 设置系统邮件配置 ***************/
	@RequestMapping("/setSystemEmailConfig.do")
	public void setSystemEmailConfig(String authCode,String host, String email, String pwd, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemEmailConfig.do ***********************");
		
		Log.debug("setSystemEmailConfig() host:" + host + " email:" + email + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(email == null && pwd == null)
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//checkAndAdd docSys.ini Dir
		if(checkAndAddDocSysIniDir())
		{
			docSysErrorLog("系统初始化目录创建失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String docSystemConfigPath = docSysWebPath + "WEB-INF/classes/";
		String tmpDocSystemConfigPath = docSysIniPath;
		String configFileName = "docSysConfig.properties";
		if(FileUtil.copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			Log.debug("setSystemEmailConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("创建临时配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}

		if(host != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "mail.smtp.host", host);
		}
		if(email != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "fromuser", email);
		}
		if(pwd != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "frompwd", pwd);
		}
		
		if(FileUtil.copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			Log.debug("setSystemEmailConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName);
			docSysErrorLog("写入配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
	}

	
	private boolean checkAndAddDocSysIniDir() {
		File docSysIniDir = new File(docSysIniPath);
		if(docSysIniDir.exists() == true)
		{
			return false;
		}
		
		return docSysIniDir.mkdirs();
	}
	
	@RequestMapping("/getSystemSmsConfig.do")
	public void getSystemSmsConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemSmsConfig.do ***********************");

		Log.debug("getSystemSmsConfig()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		String server = ReadProperties.read("docSysConfig.properties", "smsServer");
		if(server == null)
		{
			server = "";
		}
		
		String apikey = ReadProperties.read("docSysConfig.properties", "smsApikey");
		if(apikey == null)
		{
			apikey = "";
		}
		
		String tplid = ReadProperties.read("docSysConfig.properties", "smsTplid");
		if(tplid == null)
		{
			tplid = "";
		}
		
		JSONObject config = new JSONObject();
		config.put("server", server);
		config.put("apikey", apikey);
		config.put("tplid", tplid);
		
		rt.setData(config);
		writeJson(rt, response);
	}
	
	/********** 设置系统短信配置 ***************/
	@RequestMapping("/setSystemSmsConfig.do")
	public void setSystemSmsConfig(String authCode,String server, String apikey, String tplid, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemSmsConfig.do ***********************");
		
		Log.debug("setSystemSmsConfig() server:" + server + " apikey:" + apikey + " tplid:" + tplid);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(server == null && apikey == null && tplid == null)
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//checkAndAdd docSys.ini Dir
		if(checkAndAddDocSysIniDir())
		{
			docSysErrorLog("系统初始化目录创建失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String docSystemConfigPath = docSysWebPath + "WEB-INF/classes/";
		String tmpDocSystemConfigPath = docSysIniPath;
		String configFileName = "docSysConfig.properties";
		if(FileUtil.copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			Log.debug("setSystemSmsConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("创建临时配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}

		if(server != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "smsServer", server);
		}
		if(apikey != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "smsApikey", apikey);
		}
		if(tplid != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "smsTplid", tplid);
		}
		
		if(FileUtil.copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			Log.debug("setSystemSmsConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName);
			docSysErrorLog("写入配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
	}
	
	@RequestMapping("/getSystemDbConfig.do")
	public void getSystemDbConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemDbConfig.do ***********************");

		Log.debug("getSystemDbConfig()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			rt.setData("invalidAuthCode");
			writeJson(rt, response);			
			return;
		}
		
		String type = ReadProperties.read("jdbc.properties", "db.type");
		if(type == null)
		{
			type = "";
		}
		String url = ReadProperties.read("jdbc.properties", "db.url");
		if(url == null)
		{
			url = "";
		}
		String user = ReadProperties.read("jdbc.properties", "db.username");
		if(user == null)
		{
			user = "";
		}
		
		String pwd = ReadProperties.read("jdbc.properties", "db.password");
		if(pwd == null)
		{
			pwd = "";
		}
		
		JSONObject config = new JSONObject();
		config.put("type", type);
		config.put("url", url);
		config.put("user", user);
		config.put("pwd", pwd);

		rt.setData(config);
		writeJson(rt, response);
	}
	
	/********** 设置系统数据库配置 ***************/
	@RequestMapping("/setSystemDBConfig.do")
	public void setSystemDBConfig(String authCode, String type, String url, String user, String pwd, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemDBConfig.do ***********************");

		Log.debug("setSystemDBConfig() type:"  + type + " url:" + url + " user:" + user  + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(url == null && user == null && pwd == null)
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//checkAndAdd docSys.ini Dir
		if(checkAndAddDocSysIniDir())
		{
			docSysErrorLog("系统初始化目录创建失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String docSystemConfigPath = docSysWebPath + "WEB-INF/classes/";
		String tmpDocSystemConfigPath = docSysIniPath;
		String configFileName = "jdbc.properties";
		if(FileUtil.copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			Log.debug("setSystemDBConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("创建临时配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		//注意：数据库和其他配置文件不一样，为了避免setValue导致转义字符的影响，所以每次都是读取后重新写入
		boolean configChanged = false;		
		if(type != null)
		{
			configChanged = true;	
		}			
		if(url != null)
		{
			configChanged = true;	
		}
		if(user != null)
		{
			configChanged = true;
		}
		if(pwd != null)
		{
			configChanged = true;
		}
		if(configChanged == false)
		{
			Log.debug("setSystemDBConfig() 数据库配置未改动");
			docSysErrorLog("配置未改动！", rt);
			writeJson(rt, response);
			return;
		}
		
		//set Values to configFile
		if(type == null)
		{
			type = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.type");
		}
		String jdbcDriver = getJdbcDriverName(type);		
		if(url == null)
		{			
			url = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.url");
		}
		if(user == null)
		{
			user = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.username");			
		}
		if(pwd == null)
		{
			pwd = ReadProperties.getValue(tmpDocSystemConfigPath + configFileName, "db.password");
		}
		String jdbcConfig = "";
		jdbcConfig += "db.type=" + type + "\n";
		jdbcConfig += "db.url=" + url + "\n";
		jdbcConfig += "db.username=" + user + "\n";
		jdbcConfig += "db.password=" + pwd + "\n";
		jdbcConfig += "db.driver=" + jdbcDriver;
		if(FileUtil.saveDocContentToFile(jdbcConfig, tmpDocSystemConfigPath, configFileName, "UTF-8") == false)
		{
			Log.debug("setSystemDBConfig() Failed to modify " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("配置文件修改失败！", rt);
			writeJson(rt, response);
			return;			
		}
		
		if(FileUtil.copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			Log.debug("setSystemDBConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName);
			docSysErrorLog("配置文件拷贝失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		docSysIniState = 1; //needRestart
		addDocSysInitAuthCode(systemUser);
				
		writeJson(rt, response);
		
		//创建系统重启任务
		createMonitorTrigger("restart");
	}
	
	@RequestMapping("/clusterServerLoopbackTest.do")
	public void clusterServerLoopbackTest(String authCode, String msg, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** clusterServerLoopbackTest.do ***********************");

		Log.debug("clusterServerLoopbackTest() msg:[" + msg + "] authCode:[" + authCode + "]");
		
		ReturnAjax rt = new ReturnAjax();
		AuthCode auth = checkAuthCode(authCode, "clusterServerLoopbackTest", rt);
		if(auth == null)
		{
			Log.debug("clusterServerLoopbackTest checkAuthCode return false");
			rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		clusterServerLoopbackMsg = msg;
		
		writeJson(rt, response);
	}
	
	@RequestMapping("/clusterServerJoinApply.do")
	public void clusterServerJoinApply(String authCode, String serverUrl, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** clusterServerJoinApply.do ***********************");

		Log.debug("clusterServerJoinApply() serverUrl:[" + serverUrl + "] gived authCode:[" + authCode + "]");
		
		ReturnAjax rt = new ReturnAjax();
		
		//TODO: send msg to serverUrl with gived authCode
		String msg = "clusterServerTest-" + new Date().getTime() + " from [" + clusterServerUrl + "]";
		if(clusterServerReachTest(serverUrl, authCode, msg) == false)
		{
			docSysErrorLog("clusterServerReachTest Failed", rt);
		}
		
		writeJson(rt, response);
	}
	
	protected boolean clusterServerReachTest(String serverUrl, String authCode, String msg) {
		Log.info("clusterServerReachTest() msg [" + msg + "] authCode:[" + authCode + "]");
		
		boolean result = false;
        try {
    		String requestUrl = serverUrl + "/DocSystem/Manage/clusterServerTest.do";
    		Log.debug("clusterServerLoopbackTest() requestUrl:" + requestUrl);
    		HashMap<String, String> reqParams = new HashMap<String, String>();
    		reqParams.put("msg", msg);
    		reqParams.put("authCode", authCode);
    		JSONObject ret = postFileStreamAndJsonObj(requestUrl, null, null, reqParams, true);
    		if(ret != null)
    		{
    			String status = ret.getString("status");
        		if(status != null && status.equals("ok"))
        		{
        			result = true;
        		}
    		}
        } catch (Exception e) {
            errorLog(e);
        }        
        return result;		
	}

	@RequestMapping("/clusterServerTest.do")
	public void clusterServerTest(String authCode, String msg, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** clusterServerTest.do ***********************");

		Log.debug("clusterServerTest() msg:[" + msg + "] authCode:[" + authCode + "]");
		
		ReturnAjax rt = new ReturnAjax();
		AuthCode auth = checkAuthCode(authCode, "clusterServerTest", rt);
		if(auth == null)
		{
			Log.debug("clusterServerTest checkAuthCode return false");
			//rt.setError("无效授权码或授权码已过期！");
			writeJson(rt, response);			
			return;
		}
		
		//send msg back
		rt.setData(msg);
		
		writeJson(rt, response);
	}
	
	@RequestMapping("/testDatabase.do")
	public void testDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** testDatabase.do ***********************");

		Log.debug("testDatabase() type:" + type + " url:" + url + " user:" + user + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("testDatabase() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
		}
		writeJson(rt, response);
	}
	
	//强制复位数据库
	@RequestMapping("/deleteDatabase.do")
	public void deleteDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** deleteDatabase.do ***********************");

		Log.debug("deleteDatabase()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("deleteDatabase() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//backUpDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, true) == false)
		{
			Log.debug("deleteDatabase() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}		
		
		String dbName = getDBNameFromUrl(type, url);
		String tmpDbName = dbName.toLowerCase();
		Log.debug("deleteDatabase() dbName:" + dbName + " tmpDbName:" + tmpDbName);
		if(!tmpDbName.contains("docsystem")) //只能删除docsystem相关的数据库
		{
			Log.debug("deleteDatabase() 非法删除操作");
			docSysErrorLog("非法删除操作：" + dbName, rt);
			writeJson(rt, response);			
			return;			
		}
		
		if(deleteDB(type, dbName, url, user, pwd) == false)
		{
			Log.debug("deleteDatabase() 删除数据库失败");
			docSysErrorLog("数据库初始化失败", rt);
			writeJson(rt, response);			
			return;
		}
		writeJson(rt, response);
	}
	
	//强制复位数据库
	@RequestMapping("/resetDatabase.do")
	public void resetDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** resetDatabase.do ***********************");

		Log.debug("resetDatabase() type:" + type + " url:" + url + " user:" + user + " pwd:" + pwd);

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);		
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("resetDatabase() 连接数据库:" + url + " 失败");
			String dbName = getDBNameFromUrl(type, url);

			deleteDB(type, dbName, url, user, pwd);
			createDB(type, dbName, url, user, pwd);
			if(initDB(type, url, user, pwd) == false)
			{
				Log.debug("resetDatabase() 新建数据库失败");
				docSysErrorLog("新建数据库失败", rt);
				writeJson(rt, response);
				return;
			}
			writeJson(rt, response);
			return;
		}
		
		//backUpDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, true) == false)
		{
			Log.debug("resetDatabase() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//重置数据库表不删除数据库（因为删除了需要重新创建数据库，需要利用其他数据库，避免不必要的麻烦）
		//String dbName = getDBNameFromUrl(type, url);
		//deleteDB(type, dbName, url, user, pwd);
		//createDB(type, dbName, url, user, pwd);
		deleteDBTabsEx(type, url, user, pwd);
		if(initDB(type, url, user, pwd) == false)
		{
			Log.debug("resetDatabase() reset database failed: initDB error");
			docSysErrorLog("数据库初始化失败", rt);
			writeJson(rt, response);			
			return;
		}
		writeJson(rt, response);
	}
	
	@RequestMapping("/exportDBData.do")
	public void exportDBData(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** exportDBData.do ***********************");

		Log.debug("exportDBData()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("exportDBData() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//backUpDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, true) == false)
		{
			Log.debug("exportDBData() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		String targetPath = docSysIniPath + "backup/";
		String targetName = "docsystem_"+backUpTime+".zip";
		if(doCompressDir(docSysIniPath + "backup/", backUpTime, docSysIniPath + "backup/", targetName, rt) == false)
		{
			docSysErrorLog("压缩本地目录失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		Doc downloadDoc = buildDownloadDocInfo(0, "","", targetPath, targetName, 0);
		String downloadLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDoc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName;	
		rt.setData(downloadLink);
		writeJson(rt, response);
	}
	
	@RequestMapping("/importDBData.do")
	public void importDBData(MultipartFile uploadFile, String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** importDBData.do ***********************");

		Log.debug("importDBData()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		//FileUtil.saveFile to tmpPath
		if(uploadFile == null)
		{
			Log.debug("importDBData() uploadFile is null");
			docSysErrorLog("上传文件为空", rt);
			writeJson(rt, response);
			return;
		}
		String fileName = uploadFile.getOriginalFilename();
		String suffix = FileUtil.getFileSuffix(fileName);
		String webTmpPathForImportDBData = getWebTmpPath() + "importDBData/";
		FileUtil.saveFile(uploadFile, webTmpPathForImportDBData, fileName);
		
		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			Log.debug("importDBData() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
			writeJson(rt, response);
			return;
		}

		if(importDatabase(null, suffix, webTmpPathForImportDBData, fileName, type, url, user, pwd) == false)
		{
			Log.debug("importDBData() 数据库导入失败");
			docSysErrorLog("数据库导入失败", rt);
			writeJson(rt, response);
			return;			
		}
		writeJson(rt, response);
		
		//重新初始化仓库扩展配置（此时可能引入新的仓库）
		systemDisabled = 1;
		initReposExtentionConfigEx();
		systemDisabled = 0;
	}

	@RequestMapping("/getSystemInfo.do")
	public void getSystemInfo(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemInfo.do ***********************");

		Log.debug("getSystemInfo()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		String version = FileUtil.readDocContentFromFile(docSysWebPath, "version");
		if(version == null)
		{
			version = "";
		}
		
		String tomcatPath = getTomcatPath();
		String javaHome = getJavaHome();
		String officeEditorApi = Path.getOfficeEditorApi();
		String ldapConfig = getLdapConfig();
		Integer maxThreadCount = getMaxThreadCount();
		Integer redisEn = getRedisEn();
		String redisUrl = getRedisUrl();
		String clusterServerUrl = getClusterServerUrl();
		String clusterInfo = getClusterInfo();

		JSONObject config = getSystemInfo();
		config.put("docSysType", docSysType);
		config.put("isSalesServer", isSalesServer);
		
		config.put("version", version);
		config.put("tomcatPath", tomcatPath);
		config.put("javaHome", javaHome);
		config.put("ldapConfig", ldapConfig);
		config.put("logLevel", Log.logLevel);
		config.put("logFile", Log.logFileConfig);
		config.put("maxThreadCount", maxThreadCount);	
		config.put("systemDisabled", systemDisabled);
		config.put("officeDisabled", officeDisabled);
		config.put("redisEn", redisEn);
		config.put("redisUrl", redisUrl);
		config.put("clusterServerUrl", clusterServerUrl);
		config.put("clusterInfo", clusterInfo);
		
		if(docSysType < 1)
		{
			String openOfficePath = getOpenOfficePath();
			config.put("openOfficePath", openOfficePath);
		}
		config.put("officeEditorApi", officeEditorApi);
		rt.setData(config);
		writeJson(rt, response);
	}

	@RequestMapping("/getSystemLicenses.do")
	public void getSystemLicenses(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getSystemLicenses.do ***********************");
		
		Log.debug("getSystemLicenses()");
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		JSONObject systemLicense = new JSONObject();
		systemLicense.put("type", systemLicenseInfo.type);
		systemLicense.put("usersCount", systemLicenseInfo.usersCount);
		systemLicense.put("expireTime", systemLicenseInfo.expireTime);
		systemLicense.put("hasLicense", systemLicenseInfo.hasLicense);
		systemLicense.put("customer", systemLicenseInfo.customer);
		systemLicense.put("createTime", systemLicenseInfo.createTime);
		systemLicense.put("allowedAction", systemLicenseInfo.allowedAction);
		if(systemLicenseInfo.serverSN != null)
		{
			systemLicense.put("serverSN", systemLicenseInfo.serverSN);
		}
		
		JSONObject officeLicense = new JSONObject();
		officeLicense.put("mode", officeLicenseInfo.mode);
		officeLicense.put("usersCount", officeLicenseInfo.usersCount);
		officeLicense.put("connections", officeLicenseInfo.connections);
		officeLicense.put("hasLicense", officeLicenseInfo.hasLicense);
		
		
		JSONObject licenses = new JSONObject();
		licenses.put("docSysType", docSysType);
		licenses.put("systemLicense", systemLicense);
		licenses.put("officeLicense", officeLicense);
		rt.setData(licenses);
		writeJson(rt, response);
	}
	
	/********** 清除系统所有锁定 ***************/
	@RequestMapping("/cleanSystemLocks.do")
	public void cleanSystemLocks(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** cleanSystemLocks.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}

		//clean all RemoteStorageLocks
		Log.info("cleanSystemLocks() cleanAllRemoteStorageLocks Start");
		cleanAllRemoteStorageLocks();
		Log.info("cleanSystemLocks() cleanAllRemoteStorageLocks End");
		
		
		//clean all reposLocks
		Log.info("cleanSystemLocks() cleanAllReposLocks Start");
		cleanAllReposLocks();
		Log.info("cleanSystemLocks() cleanAllReposLocks End");

		//TODO: docLock logic is too complicated, so need superadmin to unlock it on repos page		
					
		writeJson(rt, response);
	}
	
	private void cleanAllRemoteStorageLocks() {
		if(redisEn)
		{
			RMap<Object, Object>  redisRemoteStorageLocksMap = redisClient.getMap("remoteStorageLocksMap");
			redisRemoteStorageLocksMap.clear();
		}
		else
		{
			remoteStorageLocksMap.clear();
		}
	}
	
	private void cleanAllReposLocks() {
		if(redisEn)
		{
			RMap<Object, Object>  redisReposLocksMap = redisClient.getMap("reposLocksMap");
			redisReposLocksMap.clear();
		}
		else
		{
			reposLocksMap.clear();
			
			//TODO: 遍历docLocksMap的lockMap，并清空
			Iterator<Entry<Integer, ConcurrentHashMap<String, DocLock>>> iterator = docLocksMap.entrySet().iterator();
	        while (iterator.hasNext()) 
	        {
	        	Entry<Integer, ConcurrentHashMap<String, DocLock>> entry = iterator.next();
	            if(entry != null)
	        	{
	            	ConcurrentHashMap<String, DocLock> lockMap = entry.getValue();
	            	lockMap.clear();
	        	}
	        }
		}
	}

	/********** 禁用系统 ***************/
	@RequestMapping("/disableSystem.do")
	public void disableSystem(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** disableSystem.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		systemDisabled = 1;
					
		writeJson(rt, response);
	}
	
	/********** 启用系统 ***************/
	@RequestMapping("/enableSystem.do")
	public void enableSystem(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** enableSystem.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		systemDisabled = 0;
					
		writeJson(rt, response);
	}
	
	/********** 禁用Office ***************/
	@RequestMapping("/disableOffice.do")
	public void disableOffice(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** disableOffice.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		officeDisabled = 1;
					
		writeJson(rt, response);
	}
	
	/********** 启用Office ***************/
	@RequestMapping("/enableOffice.do")
	public void enableOffice(String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** enableOffice.do ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		officeDisabled = 0;
					
		writeJson(rt, response);
	}
	
	/********** 禁用仓库 ***************/
	@RequestMapping("/disableRepos.do")
	public void disableSystem(Integer reposId, String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** disableRepos.do reposId:" + reposId +  " ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		setReposIsBusy(reposId, true);
					
		writeJson(rt, response);
	}
	
	/********** 启用系统 ***************/
	@RequestMapping("/enableRepos.do")
	public void enableRepos(Integer reposId, String authCode,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** enableRepos.do reposId:" + reposId +" ***********************");
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		setReposIsBusy(reposId, false);
					
		writeJson(rt, response);
	}
	
	/********** 设置系统数据库配置 ***************/
	@RequestMapping("/setSystemInfo.do")
	public void setSystemInfo(String authCode, 
			String tomcatPath, 
			String javaHome,
			String openOfficePath, 
			String officeEditorApi,
			String defaultReposStorePath,
			String systemLogStorePath,
			String indexDBStorePath,
			String salesDataStorePath,
			String ldapConfig,
			Integer logLevel,
			String logFile,
			Integer maxThreadCount,
			Integer redisEn,
			String redisUrl,
			String clusterServerUrl,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** setSystemInfo.do ***********************");

		Log.debug("setSystemInfo() tomcatPath:" + tomcatPath + " javaHome:" + javaHome 
				+ " openOfficePath:" + openOfficePath + " officeEditorApi:" + officeEditorApi 
				+ " defaultReposStorePath:" + defaultReposStorePath 
				+ " systemLogStorePath:" + systemLogStorePath 
				+ " indexDBStorePath:" + indexDBStorePath 
				+ " salesDataStorePath:" + salesDataStorePath 
				+ " maxThreadCount:" + maxThreadCount 
				+ " ldapConfig:" + ldapConfig + " logLevel:" + logLevel + " logFile:" + logFile
				+ " redisEn:" + redisEn + " redisUrl:" + redisUrl + " clusterServerUrl:" + clusterServerUrl);
		
		ReturnAjax rt = new ReturnAjax(new Date().getTime());
		
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(tomcatPath == null && 
			javaHome == null &&
			openOfficePath == null &&
			officeEditorApi == null &&
			defaultReposStorePath == null &&
			systemLogStorePath == null &&
			indexDBStorePath == null &&
			salesDataStorePath == null &&
			ldapConfig == null &&
			logLevel == null &&
			logFile == null &&
			maxThreadCount == null &&
			redisEn == null &&
			redisUrl == null &&
			clusterServerUrl == null)	
		{
			docSysErrorLog("没有参数改动，请重新设置！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//checkAndAdd docSys.ini Dir
		if(checkAndAddDocSysIniDir())
		{
			docSysErrorLog("系统初始化目录创建失败！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String docSystemConfigPath = docSysWebPath + "WEB-INF/classes/";
		String tmpDocSystemConfigPath = docSysIniPath;
		String configFileName = "docSysConfig.properties";
		if(FileUtil.copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			Log.debug("setSystemDBConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("创建临时配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		if(tomcatPath != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "tomcatPath", tomcatPath);
		}
		if(javaHome != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "javaHome", javaHome);
		}
		if(openOfficePath != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "openOfficePath", openOfficePath);
		}
		
		if(officeEditorApi != null)
		{
			officeEditorApi.replace("\\", "/");
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "officeEditorApi", officeEditorApi);
			setOfficeEditor(officeEditorApi);
			if(officeEditorApi.isEmpty())
			{	
				officeType = 0;
			}
			else
			{
				officeType = 1;				
			}
		}
		
		if(defaultReposStorePath != null)
		{
			defaultReposStorePath = Path.localDirPathFormat(defaultReposStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "defaultReposStorePath", defaultReposStorePath);
		}
		
		if(systemLogStorePath != null)
		{
			systemLogStorePath = Path.localDirPathFormat(systemLogStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "SystemLogStorePath", systemLogStorePath);
		}
		
		if(indexDBStorePath != null)
		{
			indexDBStorePath = Path.localDirPathFormat(indexDBStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "DBStorePath", indexDBStorePath);
		}
		
		if(salesDataStorePath != null)
		{
			salesDataStorePath = Path.localDirPathFormat(salesDataStorePath, OSType);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "SalesDataStorePath", salesDataStorePath);
		}
		
		if(ldapConfig != null)
		{
			if(!ldapConfig.isEmpty())
			{
				if(docSysType == constants.DocSys_Professional_Edition)
				{
					docSysErrorLog("专业版不支持LDAP登录认证，请购买企业版！", rt);
				}
				else if(docSysType == constants.DocSys_Personal_Edition)
				{
					docSysErrorLog("个人版不支持LDAP登录认证，请购买企业版！", rt);
				}
			}
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "ldapConfig", ldapConfig);
		}
		
		if(maxThreadCount != null)
		{			
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "maxThreadCount", maxThreadCount+"");
		}
		
		if(logLevel != null)
		{
			Log.logLevel = logLevel;
			setLogLevelToFile(logLevel);
		}
		
		if(logFile == null)
		{
			Log.logFileConfig = null;
			setLogFileToFile(null);
		}
		else
		{
			logFile = logFile.trim();
			if(logFile.isEmpty())
			{
				logFile = null;
			}
			Log.logFileConfig = logFile;
			setLogFileToFile(logFile);
			initLogFile(logFile);
		}
		
		if(redisEn != null)
		{
			if(redisEn != 0 && channel.isAllowedAction("clusterDeploy", rt) == false)
			{
				Log.info("当前授权证书不支持集群部署，请购买相应的授权证书!");
			}
			else
			{
				ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "redisEn", redisEn+"");
			}
		}
		
		if(redisUrl != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "redisUrl", redisUrl);
		}
		
		if(clusterServerUrl != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "serverUrl", clusterServerUrl);
		}
				
		if(FileUtil.copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			docSysDebugLog("setSystemDBConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName, rt);
			docSysErrorLog("写入配置文件失败！", rt);
			writeJson(rt, response);
			addSystemLog(request, accessUser, "setSystemInfo", "setSystemInfo", "系统设置", null, "失败",  null, null, null, buildSystemLogDetailContent(rt));
			return;
		}
				
		writeJson(rt, response);
		addSystemLog(request, accessUser, "setSystemInfo", "setSystemInfo", "系统设置", null, "成功",  null, null, null, buildSystemLogDetailContent(rt));
		
		if(ldapConfig != null)
		{
			applySystemLdapConfig(ldapConfig);			
		}
		
		if(indexDBStorePath != null)
		{
			initDocSysDataPath();
		}
		
		//initRedis() 返回true表示集群相关的参数有改动，则调用restartClusterServer
		if(initRedis())
		{
			restartClusterServer();
		}
		
	}
	
	@RequestMapping("/resetCluster.do")
	public void resetCluster(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** resetCluster.do ***********************");

		Log.debug("resetCluster() redisUrl:" + redisUrl + " clusterServerUrl:" + clusterServerUrl);
		ReturnAjax rt = new ReturnAjax();

		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(clusterServerUrl == null || clusterServerUrl.isEmpty())
		{
			docSysErrorLog("集群服务器地址未设置", rt);
			writeJson(rt, response);
			return;	
		}
		
		if(redisEn == false)
		{
			docSysErrorLog("集群未开启,请检查集群参数", rt);
			writeJson(rt, response);
			return;			
		}
		
		//ClusterServer自检(确认clusterServerUrl就是当前服务器)
		if(clusterServerLoopbackTest(clusterServerUrl) == false)
		{
			docSysErrorLog("集群服务器自检失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//强制将自己设置为过期状态，触发重新加入集群
		RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
		clusterServersMap.put(clusterServerUrl, 0L);
		//TODO: restart接口可能触发两个集群心跳线程，如何保证其唯一性
		restartClusterServer();
				
		writeJson(rt, response);
	}

	@RequestMapping("/testCluster.do")
	public void testCluster(String redisUrl, String clusterServerUrl, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** testCluster.do ***********************");

		Log.debug("testCluster() redisUrl:" + redisUrl + " clusterServerUrl:" + clusterServerUrl);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		String testResult = "1. 配置检查<br/>";
		boolean testSuccess = true;
		if(redisUrl == null || redisUrl.isEmpty())
		{
			testResult += "Redis服务器地址为空<br/>";
			testSuccess = false;
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}
		if(clusterServerUrl == null || clusterServerUrl.isEmpty())
		{
			testResult += "集群服务器地址为空<br/>";
			testSuccess = false;
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}	
		testResult += "配置正常<br/><br/>";
		
		testResult += "2. Redis服务器测试<br/>";
		testResult += "2.1 连接服务器测试<br/>";

		//注册RedissonClient对象
		//TODO: redisUrl里可以支持传递高级参数(例如密码)，因此需要先解析再连接
		JSONObject redisConfig = parseRedisConfig(redisUrl);
		Config config = new Config();
		//config.useSingleServer().setAddress(redisUrl);
		SingleServerConfig singleServerConfig = config.useSingleServer();
		singleServerConfig.setAddress(redisConfig.getString("url"));
		String password = redisConfig.getString("password");
		if(password != null && password.isEmpty() == false)
		{
			singleServerConfig.setPassword(redisConfig.getString("password"));		
		}
		
		RedissonClient redissonClient = Redisson.create(config);
        testResult += "连接成功<br/><br/>";
		
        testResult += "2.2 Lock测试<br/>";
		//Get Lock
		Log.debug("testCluster() " + Thread.currentThread().getId() + " getLock(my-lock)");
		RLock lock = redissonClient.getLock("my-lock");
		Log.debug("testCluster() " + Thread.currentThread().getId() + " try to lock(my-lock)");
        lock.lock();
        testResult += "加锁成功<br/><br/>";
        
		testResult += "2.3 Map测试<br/>";
		boolean isSuccess = true;
        try {
            Log.debug("testCluster() " + Thread.currentThread().getId() + " 执行业务.... ");
            RMap<Object, Object> map = redissonClient.getMap("myFirstMap");
            JSONObject inputData = new JSONObject();
            inputData.put("key1", "Hello! I am " + Thread.currentThread().getId() + "");
            inputData.put("key2", "Hello! I am " + Thread.currentThread().getId() + "");
            map.put("product", inputData);
            
            JSONObject var = (JSONObject) map.get("product");
            Log.debug("testCluster() " + Thread.currentThread().getId() + " key1.value=" + var.getString("key1") + " key2.value=" + var.getString("key2"));            
        } catch (Exception e) {
        	isSuccess = false;
        	Log.info(e);
        } finally {
            //手动解锁
            Log.debug("testCluster() " + Thread.currentThread().getId() + " 解锁...");
            lock.unlock();
        }
        if(isSuccess)
        {
        	testResult += "Map测试成功<br/><br/>";
        }
        else
        {
        	testResult += "Map测试失败<br/><br/>";
			testSuccess = false;
        }
        
        testResult += "3. 集群服务器测试<br/>";
        if(clusterServerLoopbackTest(clusterServerUrl) == false)
        {
        	testResult += "3.1 回环测试失败<br/><br/>";
			testSuccess = false;
        }
        else
        {
        	testResult += "3.1 回环测试成功<br/><br/>";        	        	
        }
        
		//保证服务器之间能够互相访问，向已集群的服务器发送joinApply
		if(clusterServerCrossCheck(clusterServerUrl) == false)
        {
        	testResult += "3.2 互检测试失败<br/><br/>";        	
			testSuccess = false;
        }
        else
        {
        	testResult += "3.2 互检测试成功<br/><br/>";        	        	
        }
        
		if(testSuccess)
		{
			rt.setMsgInfo(testResult);			
		}
		else
		{
			rt.setError(testResult);
		}
		writeJson(rt, response);
	}
	
	@RequestMapping("/ldapTest.do")
	public void testLDAP(String ldapConfig, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** ldapTest.do ***********************");

		Log.debug("ldapTest() ldapConfig:" + ldapConfig);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}
		
		String testResult = "1. 配置解析<br/>";
		if(ldapConfig == null || ldapConfig.isEmpty())
		{
			testResult += "配置内容为空<br/>";
			rt.setError(testResult);
			writeJson(rt, response);		
			return;
		}	
		
		LDAPConfig config = convertLdapConfig(ldapConfig);
		if(config == null)
		{
			testResult += "解析失败:<br/>";
			testResult += ldapConfig + "<br/>";
			
			rt.setError(testResult);
			writeJson(rt, response);			
			return;
		}
		testResult += "解析成功:<br/>" ;
		testResult += JSON.toJSONString(config).replace(",", "<br/>") + "<br/><br/>";
		
		getListOfSASLMechanisms(config);

		testResult += "2. 登录LDAP服务器<br/>";
		LdapContext ctx = getLDAPConnection(null, null, config);
		if(ctx == null)
		{
			Log.debug("ldapTest() getLDAPConnection 失败"); 
			
			testResult += "登录失败<br/>";
			rt.setError(testResult);
			writeJson(rt, response);			
			return;
		}
		
		testResult += "登录LDAP服务器成功<br/><br/>";
		
		testResult += "3. 获取用户信息列表<br/>";
		List<User> list = readLdap(ctx, config.basedn, config.filter, systemLdapConfig.loginMode, null);
		if(list == null)
		{
			testResult += "用户信息列表获取失败<br/>";
			rt.setError(testResult);
			writeJson(rt, response);		
			return;	    	
		}
		
		testResult += "用户信息列表获取成功<br/>";
		for(int i=0; i<list.size(); i++)
		{
			User entry = list.get(i);
			testResult += "[name:" + entry.getName() + " realName:"+ entry.getRealName() + "]<br/>";
			if(i > 6)
			{
				testResult += "...<br/>"; 
				break;
			}
		}
		rt.setData(list);
		rt.setMsgInfo(testResult);				
		writeJson(rt, response);
	}
	
	protected LDAPConfig convertLdapConfig(String ldapConfig) {
		if(ldapConfig == null || ldapConfig.isEmpty())
		{
			Log.debug("convertLdapConfig() ldapConfig is empty");
			return null;
		}
		
		LDAPConfig config = new LDAPConfig();
		String [] configs = ldapConfig.split(";");
		config.settings = getLDAPSettings(configs);		

		//获取url和basedn
		String ldapConfigUrl = configs[0].trim();
		URLInfo urlInfo = getUrlInfoFromUrl(ldapConfigUrl);
		if(urlInfo == null)
		{
			Log.debug("convertLdapConfig() ldapConfigUrl error:" + ldapConfigUrl);
			return null;
		}
		
		config.url = urlInfo.prefix + urlInfo.params[0] + "/";
		config.basedn = "";
		if(urlInfo.params.length > 1)
		{
			config.basedn = urlInfo.params[1];	//0保存的是host+port			
		}
		
		config.authentication = getLdapAuthentication(config.settings);
		config.authMode = getLdapAuthMode(config.settings);
		config.loginMode = getLdapLoginMode(config.settings);	
		config.userAccount = getLdapUserAccount(config.settings);				
		config.userPassword = getLdapUserPassword(config.settings);				
		config.filter = getLdapBaseFilter(config.settings);

		config.enabled = true;
		return config;
	}

	@RequestMapping("/upgradeSystem.do")
	public void upgradeSystem(String name, Long size, String authCode, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** upgradeSystem.do ***********************");
		Log.debug("upgradeSystem() name:" + name + " size:" + size);
		
		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}
		
		if(name == null || !name.startsWith("DocSystem"))
		{
			docSysErrorLog("非法文件名 " + name, rt);			
			writeJson(rt, response);			
			return;	
		}
		
		String upgradePath = docSysIniPath + "upgrade/";
		if(false == checkFileSizeAndCheckSum(upgradePath, name, size, null))
		{
			docSysErrorLog("文件校验失败", rt);
			writeJson(rt, response);
			return;
		}

		LongTermTask queryTask = createLongTermTask("upgradeSystem", "系统升级", rt);
		if(queryTask == null)
		{
			writeJson(rt, response);
			return;
		}

		queryTask.status = 0;  
		queryTask.info = "开始升级准备工作";
		Log.debug("upgradeSystem() " + queryTask.info);
		rt.setData(queryTask);
		writeJson(rt, response);

		//开始解压
		queryTask.status = 1;	//升级解压中
		queryTask.info = "安装包解压";
		Log.debug("upgradeSystem() " + queryTask.info);
		if(extractZipFile(upgradePath, name, upgradePath + "DocSystem-tmp/") == false)
		{
			Log.debug("upgradeSystem() 安装包解压失败");
			//docSysErrorLog("安装包解压失败", rt);
			queryTask.status = -1;
			queryTask.info = "安装包解压失败";	
			return;
		}
		queryTask.info = "安装包解压成功";	
		Log.debug("upgradeSystem() " + queryTask.info);
		
		//可能已被用户取消了
		if(queryTask.stopFlag == true)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务已被终止";	
			return;			
		}

		//检查并处理解压后的升级包
		queryTask.status = 2;
		queryTask.info = "安装包检查";
		Log.debug("upgradeSystem() " + queryTask.info);
		File tmpDocSystem = new File(upgradePath + "DocSystem-tmp/");
		File[] subEntrys = tmpDocSystem.listFiles();
		if(subEntrys.length == 1)
		{
			Log.debug("upgradeSystem() subEntryName:" + subEntrys[0].getName());
			FileUtil.moveFileOrDir(upgradePath + "DocSystem-tmp/", subEntrys[0].getName(), upgradePath, "DocSystem", false);
		}
		else
		{
			FileUtil.moveFileOrDir(upgradePath, "DocSystem-tmp", upgradePath, "DocSystem", false);			
		}
		queryTask.info = "安装包检查完成";	
		Log.debug("upgradeSystem() " + queryTask.info);

		//可能已被用户取消了
		if(queryTask.stopFlag == true)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务已被终止";	
			return;			
		}
		
		//解压成功，删除升级包
		FileUtil.delFile(upgradePath + name);	//删除压缩包
		
		//可能已被用户取消了
		if(queryTask.stopFlag == true)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务已被终止";	
			return;			
		}
		
		//开始升级
		queryTask.status = 3;
		queryTask.info = "创建升级任务";
		Log.debug("upgradeSystem() " + queryTask.info);
		if(createMonitorTrigger("upgrade") == false)
		{
			queryTask.status = -1;
			queryTask.info = "升级任务创建失败";	
			Log.debug("upgradeSystem() " + queryTask.info);
			return;
		}
		queryTask.info = "升级任务创建完成";
		Log.debug("upgradeSystem() " + queryTask.info);
				
		//monitor.sh会负责后续的升级工作
		queryTask.status = 200;	//这里用比较大的数字，是为了以后可能中间需要增加状态，参照网络的成功状态值
		queryTask.info = "准备工作已完成，等待升级";
		Log.debug("upgradeSystem() " + queryTask.info);
	}
	
	/**************** queryLongTermTask ******************/
	@RequestMapping("/queryLongTermTask.do")
	public void queryLongTermTask(
			String taskId, 
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** queryLongTermTask.do ****************");
		Log.info("queryLongTermTask taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax();
		LongTermTask task = getLongTermTaskById(taskId);
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("LongTermTask [" + taskId + "] 不存在");
			writeJson(rt, response);			
			return;
		}
		
		Log.debug("queryLongTermTask() status:" + task.status + " info:" + task.info);
		switch(task.status)
		{
		case 200:	//成功
			//延时删除下载压缩任务
			addDelayTaskForLongTermTaskDelete(task.id, 120L);	//2分钟后删除
			break;
		case -1: 	//失败
			rt.setError(task.info);
			addDelayTaskForLongTermTaskDelete(task.id, 120L);	//2分钟后删除
			break;
		default:
			//任务未结束
			break;
		}

		rt.setData(task);
		writeJson(rt, response);			
	}
	
	/**************** stopLongTermTask ******************/
	@RequestMapping("/stopLongTermTask.do")
	public void stopLongTermTask(
			String taskId, 
			HttpServletResponse response,HttpServletRequest request,HttpSession session)
	{
		Log.infoHead("************** stopLongTermTask.do ****************");
		Log.info("stopLongTermTask taskId:" + taskId);
		
		ReturnAjax rt = new ReturnAjax();
		LongTermTask task = getLongTermTaskById(taskId);
		if(task == null)
		{
			//可能任务已被取消或者超时删除
			rt.setError("LongTermTask [" + taskId + "] 不存在");
			writeJson(rt, response);			
			return;
		}
		
		//Stop longTerm Task
		
		task.stopFlag = true;
		rt.setData(task);
		writeJson(rt, response);			
	}
	
	public void addDelayTaskForLongTermTaskDelete(String taskId, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForLongTermTaskDelete() delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForLongTermTaskDelete() delayTime:" + deleteDelayTime + " 秒后开始删除查询任务！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForLongTermTaskDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** LongTermTaskDeleteDelayTask *****");
	                        longTermTaskHashMap.remove(taskId);
                        } catch(Exception e) {
	                		Log.info("******** LongTermTaskDeleteDelayTask 查询任务 [" + taskId + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	private LongTermTask getLongTermTaskById(String taskId) {
		return longTermTaskHashMap.get(taskId);
	}
	
	@RequestMapping("/restartServer.do")
	public void restartServer(String authCode, String tomcatPath, String javaHome,
			HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		Log.infoHead("****************** restartServer.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User accessUser = superAdminAccessCheck(authCode, "docSysInit", session, rt);
		if(accessUser == null)		
		{
			writeJson(rt, response);			
			return;
		}		
		
		if(createMonitorTrigger("restart") == false)
		{
			Log.debug("restartServer() 创建重启任务失败");
			docSysErrorLog("重启任务创建失败!", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
	}
	/********** 获取用户列表 ***************/
	@RequestMapping("/getUserList.do")
	public void getUserList(String userName, Integer pageIndex, Integer pageSize, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getUserList.do ***********************");

		Log.debug("getUserList() searchWord:" + userName + " pageIndex:" + pageIndex + " pageSize:" + pageSize);
		ReturnAjax rt = new ReturnAjax();
		User accessUser = adminAccessCheck(null, null, session, rt);
		if(accessUser == null)
		{
			writeJson(rt, response);			
			return;
		}
		
		User user = null;
		if(userName != null && !userName.isEmpty())
		{
			user = new User();
			user.setName(userName);
			user.setRealName(userName);
			user.setNickName(userName);
			user.setEmail(userName);
			user.setTel(userName);
		}
		
		//List <User> UserList = userService.geAllUsers();
		QueryResult queryResult = new QueryResult();
		List <User> UserList = getUserListOnPage(user, pageIndex, pageSize, queryResult);
		
		rt.setData(UserList);
		rt.setDataEx(queryResult.total);
		writeJson(rt, response);
	}
	
	@RequestMapping(value="addFirstAdminUser")
	public void addFirstAdminUser(User user, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addFirstAdminUser.do ***********************");

		Log.debug("addFirstAdminUser");
		ReturnAjax rt = new ReturnAjax();
		
		//查询系统中是否存在超级管理员
		if(isFirstAdminUserExists() == true)
		{
			docSysErrorLog("系统管理员已存在!", rt);
			writeJson(rt, response);	
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		String name = user.getName();
		if(name == null || "".equals(name))
		{
			docSysErrorLog("用户名不能为空！", rt);
			writeJson(rt, response);	
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		String pwd = user.getPwd();
		if(pwd == null || "".equals(pwd))
		{
			docSysErrorLog("密码不能为空！", rt);
			writeJson(rt, response);	
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(userCheck(user, true, true, rt) == false)
		{
			Log.debug("用户检查失败!");			
			writeJson(rt, response);
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;			
		}
		
		user.setCreateType(0);	//用户为首次添加
		user.setType(2); //系统管理员
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		user.setCreateTime(createTime);	//设置创建时间

		if(userService.addUser(user) == 0)
		{
			docSysErrorLog("Failed to add new User in DB", rt);
			writeJson(rt, response);
			addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, systemUser, "addFirstAdminUser", "addFirstAdminUser", "新增系统管理员", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		return;
	}

	@RequestMapping(value="addUser")
	public void addUser(User user, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addUser.do ***********************");

		Log.debug("addUser");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}

		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		String userName = user.getName();
		String pwd = user.getPwd();
		Integer type = user.getType();
		String tel = user.getTel();
		String email = user.getEmail();

		Log.debug("userName:"+userName + " pwd:"+pwd + " tel:" + tel + " email:" + email + "type:" + type);
		
		//检查是否越权设置
		if(type > login_user.getType())
		{
			docSysErrorLog("danger#越权操作！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		//检查用户名是否为空
		if(userName ==null||"".equals(userName))
		{
			docSysErrorLog("danger#账号不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(pwd == null || "".equals(pwd))
		{
			docSysErrorLog("密码不能为空！", rt);
			writeJson(rt, response);	
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		if(checkSystemUsersCount(rt) == false)
		{
			writeJson(rt, response);	
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		if(userCheck(user, true, true, rt) == false)
		{
			Log.debug("用户检查失败!");			
			writeJson(rt, response);
			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
				
		user.setCreateType(2);	//用户为管理员添加
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		user.setCreateTime(createTime);	//设置川剧时间

		if(userService.addUser(user) == 0)
		{
			docSysErrorLog("Failed to add new User in DB", rt);
			writeJson(rt, response);

			addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}

		addSystemLog(request, login_user, "addUser", "addUser", "新增用户", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		writeJson(rt, response);
		return;
	}

	@RequestMapping(value="editUser")
	public void editUser(User user, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** editUser.do ***********************");

		Log.printObject("editUser inputUser:", user);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		Log.printObject("editUser login_user:", login_user);
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		Integer userId = user.getId();
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		String userName = user.getName();
		Integer type = user.getType();
		String pwd = user.getPwd();
		
		Log.debug("userId:" + userId + " userName:"+userName + "type:" + type  + " pwd:" + pwd);
		
		//检查是否越权设置
		if(login_user.getType() < type)
		{
			docSysErrorLog("越权操作：您无权设置该用户等级！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		//get userInfo
		User tempUser  = userService.getUser(userId);
		if(tempUser == null)
		{
			docSysErrorLog("用户不存在！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;	
		}
		
		//注意：两个Integer类型==是地址比较
		//但Integer把-128到127（可调）的整数都提前实例化了， 所以你不管创建多少个这个范围内的Integer都是同一个对象。
		//所以在数字大于127时用==会出现逻辑错误问题
		if(userId.equals(login_user.getId()) == false)
		{
			//不得修改同级别或高级别用户的信息
			if(login_user.getType() < tempUser.getType())
			{
				docSysErrorLog("越权操作：您无权修改高级别用户的设置！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
				return;			
			}

			if(login_user.getType().equals(tempUser.getType()))
			{
				if(login_user.getId() != 0)	//系统第一个管理员用户拥有最高级权限，可以修改其他超级管理员信息
				{
					docSysErrorLog("越权操作：您无权修改同级别用户的设置！", rt);
					writeJson(rt, response);
					addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
					return;
				}
			}
		}
		
		//检查用户名是否有改动
		if(user.getName() != null)
		{
			if(tempUser.getName() != null && user.getName().equals(tempUser.getName()))
			{
				user.setName(null);
			}
		}
			
		//检查Tel是否改动
		if(user.getTel() != null)
		{
			if(tempUser.getTel() != null && user.getTel().equals(tempUser.getTel()))
			{
				user.setTel(null);
			}
		}

		//检查Email是否改动
		if(user.getEmail() != null)
		{
			if(tempUser.getEmail() != null && user.getEmail().equals(tempUser.getEmail()))
			{
				user.setEmail(null);
			}
		}
		
		if(userEditCheck(user, rt) == false)
		{
			Log.debug("用户检查失败!");			
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		if(userService.editUser(user) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "editUser", "editUser", "修改用户信息", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		return;
	}
	
	@RequestMapping(value="resetPwd")
	public void resetPwd(User user, HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** resetPwd.do ***********************");

		Log.debug("resetPwd");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 2)
		{
			docSysErrorLog("您无权进行此操作！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;			
		}
		
		Integer userId = user.getId();
		String pwd = user.getPwd();
		
		Log.debug("userId:" +userId + " pwd:" + pwd);
	
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		//不得修改同级别或高级别用户的密码
		if(!userId.equals(login_user.getId()))
		{
			User tempUser  = userService.getUser(userId);
			if(tempUser.getType() > login_user.getType())
			{
				docSysErrorLog("越权操作：您无权修改高级别用户的密码！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
				return;			
			}
			
			if(tempUser.getType().equals(login_user.getType()))
			{
				if(login_user.getId() != 0)	//系统第一个管理员用户拥有最高级权限，可以重置其他超级管理员密码
				{
					docSysErrorLog("越权操作：您无权修改同级别用户的密码！", rt);
					writeJson(rt, response);
					addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
					return;			
				}
			}
		}	
				
		
		if(userService.editUser(user) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "失败", null, null, null, buildSystemLogDetailContent(rt));				
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "resetPwd", "resetPwd", "重置用户密码", null, "成功", null, null, null, buildSystemLogDetailContent(rt));				
		return;
	}

	
	@RequestMapping(value="delUser")
	public void delUser(Integer userId, HttpSession session, HttpServletRequest request, HttpServletResponse response)
	{
		Log.infoHead("****************** delUser.do ***********************");

		Log.debug("delUser " + userId);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(login_user.getType() < 2)
		{
			docSysErrorLog("您无权进行此操作！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;			
		}
		
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(!userId.equals(login_user.getId()))
		{
			//不得删除同级别或高级别用户
			User tempUser  = userService.getUser(userId);
			if(tempUser == null)
			{
				docSysErrorLog("用户不存在！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
				return;	
			}

			if(tempUser.getType() > login_user.getType())
			{
				docSysErrorLog("越权操作：您无权删除高级别用户！", rt);
				writeJson(rt, response);
				addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
				return;			
			}
	
			if(tempUser.getType().equals(login_user.getType()))
			{
				if(login_user.getId() != 0)	//系统第一个管理员用户拥有最高级权限，可以删除其他超级管理员
				{
					docSysErrorLog("越权操作：您无权删除同级别用户！", rt);
					writeJson(rt, response);
					addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
					return;			
				}
			}		
		}
		
		if(userService.delUser(userId) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;		
		}
		
		//Delete all related ReposAuth \ DocAuth \GroupMember Infos
		DocAuth docAuth = new DocAuth();
		docAuth.setUserId(userId);
		reposService.deleteDocAuthSelective(docAuth);
		ReposAuth reposAuth = new ReposAuth();
		reposAuth.setUserId(userId);
		reposService.deleteReposAuthSelective(reposAuth);
		GroupMember groupMember = new GroupMember();
		groupMember.setUserId(userId);
		userService.deleteGroupMemberSelective(groupMember);
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "delUser", "delUser", "删除用户", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	/********** 获取仓库列表 ***************/
	@RequestMapping("/getReposList.do")
	public void getReposList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getReposList.do ***********************");

		Log.debug("getReposList()");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		List <Repos> list = getAllReposes();
		
		//Set isTextSearchEnabled and remoteStorageConfig which will be used for editRepos
		if(list != null)
		{
			for(int i=0; i<list.size(); i++)
			{
				Repos repos = list.get(i);
				repos = getReposEx(repos);
			}
		}
		
		rt.setData(list);
		writeJson(rt, response);
	}

	private List<Repos> getAllReposes() {
		List <Repos> list = userService.geAllReposes();
		return list;
	}
	
	/********** 获取系统所有用户 ：前台用于给repos添加访问用户，返回的结果实际上是reposMember列表***************/
	@RequestMapping("/getReposAllUsers.do")
	public void getReposAllUsers(String searchWord, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getReposAllUsers.do ***********************");
		
		Log.debug("getReposAllUsers reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		
		User user = null;
		if(searchWord != null && !searchWord.isEmpty())
		{
			user = new User();
			user.setName(searchWord);
			user.setRealName(searchWord);
			user.setNickName(searchWord);
			user.setEmail(searchWord);
			user.setTel(searchWord);
		}
		
		List<ReposMember> UserList = null;
		if(user == null)
		{
			UserList = userService.getReposAllUsers(reposId);
		}
		else
		{
			HashMap<String, String> param = buildQueryParamForObj(user, null, null);
			param.put("reposId", reposId+"");
			UserList = userService.queryReposMemberWithParamLike(param);				
		}
		Log.printObject("UserList:",UserList);
				
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	/********** 获取用户组列表 ***************/
	@RequestMapping("/getGroupList.do")
	public void getGroupList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getGroupList.do ***********************");
		
		Log.debug("getGroupList()");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		//获取All UserList
		List <UserGroup> GroupList = getAllGroups();
		
		rt.setData(GroupList);
		writeJson(rt, response);
	}

	private List<UserGroup> getAllGroups() {
		List <UserGroup> GroupList = userService.geAllGroups();
		return GroupList;
	}
	
	@RequestMapping(value="addGroup")
	public void addGroup(UserGroup group, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addGroup.do ***********************");

		Log.debug("addGroup");
		String name = group.getName();
		String info = group.getInfo();
		
		Log.debug("name:"+name + " info:"+info);
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//检查用户名是否为空
		if(name ==null||"".equals(name))
		{
			docSysErrorLog("组名不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(isGroupExist(name) == true)
		{
			docSysErrorLog("用户组 " + name + " 已存在！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
	
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		group.setCreateTime(createTime);	//设置川剧时间

		if(userService.addGroup(group) == 0)
		{
			docSysErrorLog("Failed to add new Group in DB", rt);
			writeJson(rt, response);

			addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}

		addSystemLog(request, login_user, "addGroup", "addGroup", "新增用户组", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		writeJson(rt, response);
		return;
	}

	private boolean isGroupExist(String name) {
		UserGroup qGroup = new UserGroup();
		//检查用户名是否为空
		if(name==null||"".equals(name))
		{
			return true;
		}
			
		qGroup.setName(name);
		List<UserGroup> list = userService.getGroupListByGroupInfo(qGroup);
		if(list == null || list.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	@RequestMapping(value="delGroup")
	public void delGroup(Integer id, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** delGroup.do ***********************");

		Log.debug("delGroup " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "delGroup", "delGroup", "删除用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(userService.delGroup(id) == 0)
		{
			docSysErrorLog("Failed to delete Group from DB", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delGroup", "delGroup", "删除用户组", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;		
		}
		
		//Delete all related ReposAuth \ DocAuth \GroupMember Infos
		DocAuth docAuth = new DocAuth();
		docAuth.setGroupId(id);
		reposService.deleteDocAuthSelective(docAuth);
		ReposAuth reposAuth = new ReposAuth();
		reposAuth.setGroupId(id);
		reposService.deleteReposAuthSelective(reposAuth);
		GroupMember groupMember = new GroupMember();
		groupMember.setGroupId(id);
		userService.deleteGroupMemberSelective(groupMember);
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "delGroup", "delGroup", "删除用户组", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	@RequestMapping(value="editGroup")
	public void editGroup(UserGroup group, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** editGroup.do ***********************");

		Log.debug("editGroup");

		Integer groupId = group.getId();
		String name = group.getName();
		String info = group.getInfo();

		Log.debug("name:"+name + " info:"+info);
	
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(groupId == null)
		{
			docSysErrorLog("用户组ID不能为空", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(userService.editGroup(group) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "editGroup", "editGroup", "修改用户组信息", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;
	}
	
	/********** 获取系统所有用户 ：前台用于给group添加访问用户，返回的结果实际上是groupMember列表***************/
	@RequestMapping("/getGroupAllUsers.do")
	public void getGroupAllUsers(String searchWord, Integer groupId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** getGroupAllUsers.do ***********************");

		Log.debug("getGroupAllUsers searchWord:" + searchWord + " groupId: " + groupId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			return;
		}
		
		User user = null;
		if(searchWord != null && !searchWord.isEmpty())
		{
			user = new User();
			user.setName(searchWord);
			user.setRealName(searchWord);
			user.setNickName(searchWord);
			user.setEmail(searchWord);
			user.setTel(searchWord);
		}
		
		List <GroupMember> UserList = null;
		if(user == null)
		{
			UserList = userService.getGroupAllUsers(groupId);	
		}
		else
		{
			HashMap<String, String> param = buildQueryParamForObj(user, null, null);
			param.put("groupId",groupId+"");
			UserList = userService.queryGroupMemberWithParamLike(param);				
		}
		Log.printObject("UserList:",UserList);
		
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	@RequestMapping(value="addGroupMember")
	public void addGroupMember(Integer groupId,Integer userId, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("****************** addGroupMember.do ***********************");

		Log.debug("addGroupMember groupId:" + groupId + " userId:" + userId);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//检查GroupId是否为空
		if(groupId == null)
		{
			docSysErrorLog("组ID不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		//检查用户ID是否为空
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		GroupMember groupMember = new GroupMember();
		groupMember.setGroupId(groupId);
		groupMember.setUserId(userId);
		
		if(isGroupMemberExist(groupMember) == true)
		{
			Log.debug("addGroupMember() 用户 " + userId + " 已是该组成员！");
			docSysErrorLog("用户 " + userId + " 已是该组成员！", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
	
		if(userService.addGroupMember(groupMember) == 0)
		{
			Log.debug("addGroupMember() Failed to add groupMember");
			docSysErrorLog("Failed to add new GroupMember in DB", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "addGroupMember", "addGroupMember", "添加用户组成员", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;
	}

	private boolean isGroupMemberExist(GroupMember groupMember) {
		List<GroupMember> list = userService.getGroupMemberListByGroupMemberInfo(groupMember);
		if(list == null || list.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	@RequestMapping(value="delGroupMember")
	public void delGroupMember(Integer id, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		Log.infoHead("delGroupMember " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "delGroupMember", "delGroupMember", "删除用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		if(userService.delGroupMember(id) == 0)
		{
			docSysErrorLog("Failed to delete GroupMember from DB", rt);
			writeJson(rt, response);
			addSystemLog(request, login_user, "delGroupMember", "delGroupMember", "删除用户组成员", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		writeJson(rt, response);
		addSystemLog(request, login_user, "delGroupMember", "delGroupMember", "删除用户组成员", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	@RequestMapping(value="getSystemLog")
	public void getSystemLog(String fileName,HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception{

		Log.infoHead("****************** getSystemLog.do ***********************");

		Log.debug("getSystemLog: " + fileName);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		String localParentPath = Path.getSystemLogParentPath(docSysWebPath);
		if(localParentPath == null)
		{
			docSysErrorLog("获取日志路径失败！", rt);
			//writeJson(rt, response);			
			//return;
			throw new Exception(rt.getMsgInfo());
		}
		
		if(fileName == null || "".equals(fileName))
		{
			fileName = Path.getSystemLogFileName();
		}
		
		sendTargetToWebPage(localParentPath,fileName, localParentPath, rt, response, request, false, null);
		return;		
	}
	
	@RequestMapping(value="downloadLogFile")
	public void downloadLogFile(HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception{

		Log.infoHead("****************** downloadLogFile.do ***********************");

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		String logFilePath = Log.logFile;
		if(logFilePath == null || logFilePath.isEmpty())
		{
			logFilePath = defaultLogFilePath;
		}
		
		File file = new File(logFilePath);
		if(file.exists() == false)
		{
			docSysErrorLog("日志文件不存在！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;							
		}
		
		String[] temp = new String[2]; 
		if(Path.seperatePathAndName(logFilePath, temp) < 0)
		{
			docSysErrorLog("日志文件路径错误:" + logFilePath, rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;										
		}
		String path = Path.localDirPathFormat(temp[0], OSType);
		String name = temp[1];	
		
		Log.debug("downloadLogFile() path:" + path + " name:" + name);		
		Doc downloadDoc = buildDownloadDocInfo(0, "","", path, name, 0);
		downloadDoc.encryptEn = 0;
		
		String downloadLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDoc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName;
		rt.setData(downloadLink);
		writeJson(rt, response);			
		addSystemLog(request, login_user, "downloadLogFile", "downloadLogFile", "下载调试日志", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
		return;		
	}
	
	//cleanLogFile
	@RequestMapping("/cleanLogFile.do")
	public void cleanLogFile(String authCode, HttpSession session, HttpServletRequest request, HttpServletResponse response){
		Log.infoHead("*********** cleanLogFile *******************");

		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			docSysErrorLog("非管理员用户，请联系统管理员！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;
		}
		
		String logFilePath = Log.logFile;
		if(logFilePath == null || logFilePath.isEmpty())
		{
			logFilePath = defaultLogFilePath;
		}
		
		File file = new File(logFilePath);
		if(file.exists() == false)
		{
			docSysErrorLog("日志文件 "  + logFilePath + " 不存在！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;							
		}
		
		if(FileUtil.delFile(logFilePath) == false)
		{
			docSysErrorLog("日志清除失败，请稍候重试！", rt);
			writeJson(rt, response);			
			addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "失败", null, null, null, buildSystemLogDetailContent(rt));							
			return;							
		}
		
        writeJson(rt, response);		
		addSystemLog(request, login_user, "cleanLogFile", "cleanLogFile", "清除调试日志", null, "成功", null, null, null, buildSystemLogDetailContent(rt));							
	}

}
