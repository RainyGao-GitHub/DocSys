package com.DocSystem.controller;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import util.DateFormat;
import util.ReadProperties;
import util.RegularUtil;
import util.ReturnAjax;
import com.DocSystem.entity.DocAuth;
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
		System.out.println("docSysInit()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(docSysInit(true) == true)
		{
			docSysIniState = 0;
		}
		else
		{
			docSysErrorLog("系统初始化失败，请检查数据库配置是否正确？", rt);
		}
		writeJson(rt, response);
	}
	
	/********** 获取轮播图配置 ***************/
	@RequestMapping("/getBannerConfig.do")
	public void getBannerConfig(String serverIP, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getBannerConfig() serverIP:" + serverIP);
		collectDocSysInstallationInfo(serverIP, request);
		
		ReturnAjax rt = new ReturnAjax();

		//设置跨域访问允许
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", " GET,POST,OPTIONS,HEAD");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept,Authorization");
		response.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
		
		String BannerConfigPath = docSysIniPath;
		if(isFileExist(BannerConfigPath + "bannerConfig.json") == false)
		{
			BannerConfigPath = docSysWebPath + "WEB-INF/classes/";
			if(isFileExist(BannerConfigPath + "bannerConfig.json") == false)
			{
				docSysErrorLog("bannerConfig.json文件不存在",rt);
				writeJson(rt, response);
				return;	
			}
		}
		
		String s = readDocContentFromFile(BannerConfigPath, "bannerConfig.json", false);
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
		System.out.println("getSystemEmailConfig()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
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
	
	
	
	private boolean mamageAccessCheck(String authCode, String expUsage, HttpSession session, ReturnAjax rt) {
		if(authCode != null)
		{
			if(checkAuthCode(authCode,"docSysInit") == true)
			{
				return true;
			}
			docSysErrorLog("无效授权码或授权码已过期！", rt);
			return false;
		}
		else
		{
			User login_user = (User) session.getAttribute("login_user");
			if(login_user == null)
			{
				docSysErrorLog("用户未登录，请先登录！", rt);
				return false;
			}
				
			if(login_user.getType() < 1)
			{
				docSysErrorLog("非管理员用户，请联系统管理员！", rt);
				return false;
			}
			return true;
		}
	}

	/********** 设置系统邮件配置 ***************/
	@RequestMapping("/setSystemEmailConfig.do")
	public void setSystemEmailConfig(String authCode,String host, String email, String pwd, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("setSystemEmailConfig() host:" + host + " email:" + email + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
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
		if(copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			System.out.println("setSystemEmailConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
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
		
		if(copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			System.out.println("setSystemEmailConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName);
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
		System.out.println("getSystemSmsConfig()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
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
		
		JSONObject config = new JSONObject();
		config.put("server", server);
		config.put("apikey", apikey);
		
		rt.setData(config);
		writeJson(rt, response);
	}
	
	@RequestMapping("/getSystemDbConfig.do")
	public void getSystemDbConfig(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getSystemDbConfig()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
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
		System.out.println("setSystemDBConfig() type:"  + type + " url:" + url + " user:" + user  + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
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
		if(copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			System.out.println("setSystemDBConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
			docSysErrorLog("创建临时配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		if(type != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "db.type", type);
		}
		if(url != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "db.url", url);
		}
		if(user != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "db.username", user);
		}
		if(pwd != null)
		{
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "db.password", pwd);
		}
		
		if(copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			System.out.println("setSystemDBConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName);
			docSysErrorLog("写入配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
	}
	
	@RequestMapping("/testDatabase.do")
	public void testDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("testDatabase() type:" + type + " url:" + url + " user:" + user + " pwd:" + pwd);
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			System.out.println("testDatabase() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
		}
		writeJson(rt, response);
	}
	
	//强制复位数据库
	@RequestMapping("/deleteDatabase.do")
	public void deleteDatabase(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		System.out.println("deleteDatabase()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			System.out.println("deleteDatabase() 连接数据库:" + url + " 失败");
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
			System.out.println("deleteDatabase() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}		
		
		String dbName = getDBNameFromUrl(type, url);
		String tmpDbName = dbName.toLowerCase();
		System.out.println("deleteDatabase() dbName:" + dbName + " tmpDbName:" + tmpDbName);
		if(!tmpDbName.contains("docsystem")) //只能删除docsystem相关的数据库
		{
			System.out.println("deleteDatabase() 非法删除操作");
			docSysErrorLog("非法删除操作：" + dbName, rt);
			writeJson(rt, response);			
			return;			
		}
		
		if(deleteDB(type, dbName, url, user, pwd) == false)
		{
			System.out.println("deleteDatabase() 删除数据库失败");
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
		System.out.println("resetDatabase() type:" + type + " url:" + url + " user:" + user + " pwd:" + pwd);

		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			System.out.println("resetDatabase() 连接数据库:" + url + " 失败");
			String dbName = getDBNameFromUrl(type, url);

			createDB(type, dbName, url, user, pwd);
			if(initDB(type, url, user, pwd) == false)
			{
				System.out.println("resetDatabase() 新建数据库失败");
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
			System.out.println("resetDatabase() 数据库备份失败!");
			docSysErrorLog("备份数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		deleteDBTabsEx(type, url, user, pwd);
		if(initDB(type, url, user, pwd) == false)
		{
			System.out.println("resetDatabase() reset database failed: initDB error");
			docSysErrorLog("数据库初始化失败", rt);
			writeJson(rt, response);			
			return;
		}
		writeJson(rt, response);
	}
	
	@RequestMapping("/exportDBData.do")
	public void exportDBData(String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		System.out.println("exportDBData()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}

		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			System.out.println("exportDBData() 连接数据库:" + url + " 失败");
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
			System.out.println("exportDBData() 数据库备份失败!");
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
		
		Doc downloadDoc = buildDownloadDocInfo(targetPath, targetName);
		rt.setData(downloadDoc);
		rt.setMsgData(1);	//下载完成后删除已下载的文件
		writeJson(rt, response);
	}
	
	@RequestMapping("/importDBData.do")
	public void importDBData(MultipartFile uploadFile, String type, String url, String user, String pwd, String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		System.out.println("importDBData()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}
		
		//saveFile to tmpPath
		if(uploadFile == null)
		{
			System.out.println("importDBData() uploadFile is null");
			docSysErrorLog("上传文件为空", rt);
			writeJson(rt, response);
			return;
		}
		String fileName = uploadFile.getOriginalFilename();
		String suffix = getFileSuffix(fileName);
		String webTmpPathForImportDBData = getWebTmpPath() + "importDBData/";
		saveFile(uploadFile, webTmpPathForImportDBData, fileName);
		
		if(testDB(type, url, user, pwd) == false)	//数据库不存在
		{
			System.out.println("importDBData() 连接数据库:" + url + " 失败");
			docSysErrorLog("连接数据库失败", rt);
			writeJson(rt, response);
			return;
		}

		if(importDatabase(null, suffix, webTmpPathForImportDBData, fileName, type, url, user, pwd) == false)
		{
			System.out.println("importDBData() 数据库导入失败");
			docSysErrorLog("数据库导入失败", rt);
			writeJson(rt, response);
			return;			
		}
		writeJson(rt, response);
	}

	@RequestMapping("/getSystemInfo.do")
	public void getSystemInfo(String authCode, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getSystemInfo()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}
		
		String version = readDocContentFromFile(docSysWebPath, "version", false);
		if(version == null)
		{
			version = "";
		}
		
		String tomcatPath = getTomcatPath();
		String javaHome = getJavaHome();
		String openOfficePath = getOpenOfficePath();
		String officeEditorApi = getOfficeEditorApi();
		String defaultReposStorePath = getDefaultReposRootPath();

		JSONObject config = new JSONObject();
		config.put("version", version);
		config.put("tomcatPath", tomcatPath);
		config.put("javaHome", javaHome);
		config.put("openOfficePath", openOfficePath);
		config.put("officeEditorApi", officeEditorApi);
		config.put("defaultReposStorePath", defaultReposStorePath);
		rt.setData(config);
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
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("setSystemInfo() tomcatPath:" + tomcatPath + " javaHome:" + javaHome + " openOfficePath:" + openOfficePath + " officeEditorApi:" + officeEditorApi + " defaultReposStorePath:" + defaultReposStorePath);
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}
		
		if(tomcatPath == null && openOfficePath == null && javaHome == null)
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
		if(copyFile(docSystemConfigPath + configFileName, tmpDocSystemConfigPath + configFileName, true) == false)
		{
			//Failed to copy 
			System.out.println("setSystemDBConfig() Failed to copy " + docSystemConfigPath + configFileName + " to " + tmpDocSystemConfigPath + configFileName);
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
		}
		
		if(defaultReposStorePath != null)
		{
			defaultReposStorePath = localDirPathFormat(defaultReposStorePath);
			ReadProperties.setValue(tmpDocSystemConfigPath + configFileName, "defaultReposStorePath", defaultReposStorePath);
		}
		
		if(copyFile(tmpDocSystemConfigPath + configFileName, docSystemConfigPath + configFileName, true) == false)
		{
			System.out.println("setSystemDBConfig() Failed to copy " + tmpDocSystemConfigPath + configFileName + " to " + docSystemConfigPath + configFileName);
			docSysErrorLog("写入配置文件失败！", rt);
			writeJson(rt, response);
			return;
		}
		
		
		writeJson(rt, response);
	}

	@RequestMapping("/upgradeSystem.do")
	public void upgradeSystem(MultipartFile uploadFile, String authCode, 
			HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		System.out.println("upgradeSystem()");
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}
		
		//saveFile to tmpPath
		if(uploadFile == null)
		{
			System.out.println("upgradeSystem() uploadFile is null");
			docSysErrorLog("上传文件为空", rt);
			writeJson(rt, response);
			return;
		}
		String fileName = uploadFile.getOriginalFilename();
		if(!fileName.equals("DocSystem.war"))
		{
			System.out.println("upgradeSystem() 非法升级文件");
			docSysErrorLog("非法升级文件:" + fileName, rt);
			writeJson(rt, response);
			return;
		}		
		if(saveFile(uploadFile, docSysIniPath, fileName) == null)
		{
			System.out.println("upgradeSystem() 保存升级文件失败");
			docSysErrorLog("保存升级文件失败", rt);
			writeJson(rt, response);
			return;
		}
		
		//开始升级
		if(copyFile(docSysIniPath + fileName, docSysIniPath + "../DocSystem.war", true) == false)
		{
			System.out.println("upgradeSystem() 升级系统失败");
			docSysErrorLog("升级系统失败", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
	}
	
	@RequestMapping("/restartServer.do")
	public void restartTomcat(String authCode, String tomcatPath, String javaHome,
			HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		System.out.println("restartTomcat() tomcatPath:" + tomcatPath);
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(authCode, "docSysInit", session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}
		
		//saveFile to tmpPath
		if(tomcatPath == null)
		{
			System.out.println("restartTomcat() tomcatPath is null");
			docSysErrorLog("Tomcat安装路径未指定", rt);
			writeJson(rt, response);
			return;
		}
		
		//开始重启
		if(restartTomcat(tomcatPath, javaHome) == false)
		{
			System.out.println("restartTomcat() 重启服务失败");
			docSysErrorLog("重启服务失败", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
	}
	/********** 获取用户列表 ***************/
	@RequestMapping("/getUserList.do")
	public void getUserList(String userName, Integer pageIndex, Integer pageSize, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getUserList() userName:" + userName + " pageIndex:" + pageIndex + " pageSize:" + pageSize);
		ReturnAjax rt = new ReturnAjax();
		if(mamageAccessCheck(null, null, session, rt) == false)
		{
			writeJson(rt, response);			
			return;
		}
		
		User user = null;
		if(userName != null && !userName.isEmpty())
		{
			user = new User();
			user.setName(userName);
		}
		
		//List <User> UserList = userService.geAllUsers();
		HashMap<String, String> param = buildQueryParamForObj(user, DOCSYS_USER, pageIndex, pageSize);
		Integer total = userService.getCountWithParam(param);
		List <User> UserList = userService.getUserListWithParam(param);
		
		System.out.println("getUserList() total:" + total);
		
		rt.setData(UserList);
		rt.setDataEx(total);
		writeJson(rt, response);
	}

	private HashMap<String, String> buildQueryParamForObj(Object obj, int objType, Integer pageIndex, Integer pageSize) {
		HashMap<String, String> param = new HashMap<String,String>();
		JSONArray ObjMemberList = getObjMemberList(objType);
		System.out.println("buildQueryParamForObj pageIndex:" + pageIndex + " pageSize:" + pageSize);
		if(pageIndex != null && pageSize != null)
		{
			String start = pageIndex*pageSize + "";
			String number =  pageSize+"";
			System.out.println("buildQueryParamForObj start:" + start + " number:" + number);
			param.put("start", start);
			param.put("number", number);
		}
		
		if(obj == null)
		{
			return param;
		}
		
		if(ObjMemberList == null)
		{
			return param;
		}
			
		for(int i=0; i<ObjMemberList.size(); i++)
		{
            JSONObject objMember = (JSONObject)ObjMemberList.get(i);
        	String name = (String) objMember.get("name");
              
 			Object value = null;
			try {
				value = getFieldValue(obj, name);
			} catch (Exception e) {
				e.printStackTrace();
				return param;
			}
			
			if(value != null)
			{
				param.put(name, value + "");
			}			
		}
		
		return param;
	}
	
	@RequestMapping(value="addUser")
	public void addUser(User user, HttpSession session,HttpServletResponse response)
	{
		System.out.println("addUser");
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

		System.out.println("userName:"+userName + " pwd:"+pwd + "type:" + type);
		
		//检查是否越权设置
		if(type > login_user.getType())
		{
			docSysErrorLog("danger#越权操作！", rt);
			writeJson(rt, response);
			return;
		}
		
		//检查用户名是否为空
		if(userName ==null||"".equals(userName))
		{
			docSysErrorLog("danger#账号不能为空！", rt);
			writeJson(rt, response);
			return;
		}
		
		
		if(RegularUtil.isEmail(userName))	//邮箱注册
		{
			if(isUserRegistered(userName) == true)
			{
				docSysErrorLog("error#该邮箱已注册！", rt);
				writeJson(rt, response);
				return;
			}
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			if(isUserRegistered(userName) == true)
			{
				docSysErrorLog("error#该手机已注册！", rt);
				writeJson(rt, response);
				return;
			}
		}
		else
		{
			if(isUserRegistered(userName) == true)
			{
				docSysErrorLog("error#该用户名已注册！", rt);
				writeJson(rt, response);
				return;
			}
		}
		
		//检查密码是否为空
		if(pwd==null||"".equals(pwd))
		{
			docSysErrorLog("danger#密码不能为空！", rt);
			writeJson(rt, response);
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
		}
		
		writeJson(rt, response);
		return;
	}
	
	@RequestMapping(value="editUser")
	public void editUser(User user, HttpSession session,HttpServletResponse response)
	{
		System.out.println("editUser");
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
		
		Integer userId = user.getId();
		String userName = user.getName();
		Integer type = user.getType();
		String pwd = user.getPwd();
		
		System.out.println("userName:"+userName + "type:" + type  + " pwd:" + pwd);
		
		//检查是否越权设置
		if(type > login_user.getType())
		{
			docSysErrorLog("danger#越权操作！", rt);
			writeJson(rt, response);
			return;
		}
		
		//不得修改同级别或高级别用户的信息
		User tempUser  = userService.getUser(userId);
		if(tempUser.getType() >= login_user.getType())
		{
			docSysErrorLog("danger#越权操作！", rt);
			writeJson(rt, response);
			return;			
		}
		
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			return;
		}
		
		if(userService.editUser(user) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}
	
	@RequestMapping(value="resetPwd")
	public void resetPwd(User user, HttpSession session,HttpServletResponse response)
	{
		System.out.println("resetPwd");
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
			return;			
		}
		
		Integer userId = user.getId();
		String pwd = user.getPwd();
		
		System.out.println("userId:" +userId + " pwd:" + pwd);
	
		if(userId == null)
		{
			docSysErrorLog("用户ID不能为空", rt);
			writeJson(rt, response);
			return;
		}
		
		//不得修改同级别或高级别用户的信息
		if(userId != login_user.getId())
		{
			User tempUser  = userService.getUser(userId);
			if(tempUser.getType() >= login_user.getType())
			{
				docSysErrorLog("danger#越权操作！", rt);
				writeJson(rt, response);
				return;			
			}
		}	
				
		
		if(userService.editUser(user) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}

	
	@RequestMapping(value="delUser")
	public void delUser(Integer userId, HttpSession session,HttpServletResponse response)
	{
		System.out.println("delUser " + userId);
		
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
			return;			
		}
		
		if(userService.delUser(userId) == 0)
		{
			docSysErrorLog("Failed to delete User in DB", rt);
			writeJson(rt, response);
			return;		
		}
		else
		{
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
		}
		
		writeJson(rt, response);
		return;		
	}
	
	/********** 获取仓库列表 ***************/
	@RequestMapping("/getReposList.do")
	public void getReposList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposList()");
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
		
		rt.setData(list);
		writeJson(rt, response);
	}

	private List<Repos> getAllReposes() {
		List <Repos> list = userService.geAllReposes();
		return list;
	}
	
	/********** 获取系统所有用户 ：前台用于给repos添加访问用户，返回的结果实际上是reposMember列表***************/
	@RequestMapping("/getReposAllUsers.do")
	public void getReposAllUsers(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposAllUsers reposId: " + reposId);
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
		
		List <ReposMember> UserList = userService.getReposAllUsers(reposId);	
		printObject("UserList:",UserList);
		
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	/********** 获取用户组列表 ***************/
	@RequestMapping("/getGroupList.do")
	public void getGroupList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getGroupList()");
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
	public void addGroup(UserGroup group, HttpSession session,HttpServletResponse response)
	{
		System.out.println("addGroup");
		String name = group.getName();
		String info = group.getInfo();
		
		System.out.println("name:"+name + " info:"+info);
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
		
		//检查用户名是否为空
		if(name ==null||"".equals(name))
		{
			docSysErrorLog("组名不能为空！", rt);
			writeJson(rt, response);
			return;
		}
		
		if(isGroupExist(name) == true)
		{
			docSysErrorLog("用户组 " + name + " 已存在！", rt);
			writeJson(rt, response);
			return;
		}
	
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		group.setCreateTime(createTime);	//设置川剧时间

		if(userService.addGroup(group) == 0)
		{
			docSysErrorLog("Failed to add new Group in DB", rt);
		}
		
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
	public void delGroup(Integer id, HttpSession session,HttpServletResponse response)
	{
		System.out.println("delGroup " + id);
		
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
		
		if(userService.delGroup(id) == 0)
		{
			docSysErrorLog("Failed to delete Group from DB", rt);
			writeJson(rt, response);
			return;		
		}
		else
		{
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
		}
		
		writeJson(rt, response);
		return;		
	}
	
	@RequestMapping(value="editGroup")
	public void editGroup(UserGroup group, HttpSession session,HttpServletResponse response)
	{
		System.out.println("editGroup");

		Integer groupId = group.getId();
		String name = group.getName();
		String info = group.getInfo();

		System.out.println("name:"+name + " info:"+info);
	
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
		
		if(groupId == null || "".equals(groupId))
		{
			docSysErrorLog("用户组ID不能为空", rt);
			writeJson(rt, response);
			return;
		}
		
		if(userService.editGroup(group) == 0)
		{
			docSysErrorLog("更新数据库失败", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}
	
	/********** 获取系统所有用户 ：前台用于给group添加访问用户，返回的结果实际上是groupMember列表***************/
	@RequestMapping("/getGroupAllUsers.do")
	public void getGroupAllUsers(Integer groupId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getGroupAllUsers groupId: " + groupId);
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
		
		List <GroupMember> UserList = userService.getGroupAllUsers(groupId);	
		printObject("UserList:",UserList);
		
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	@RequestMapping(value="addGroupMember")
	public void addGroupMember(Integer groupId,Integer userId, HttpSession session,HttpServletResponse response)
	{
		System.out.println("addGroupMember groupId:" + groupId + " userId:" + userId);
		
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
		
		//检查GroupId是否为空
		if(groupId ==null||"".equals(groupId))
		{
			docSysErrorLog("组ID不能为空！", rt);
			writeJson(rt, response);
			return;
		}
		
		//检查用户ID是否为空
		if(userId ==null||"".equals(userId))
		{
			docSysErrorLog("用户ID不能为空！", rt);
			writeJson(rt, response);
			return;
		}
		GroupMember groupMember = new GroupMember();
		groupMember.setGroupId(groupId);
		groupMember.setUserId(userId);
		
		if(isGroupMemberExist(groupMember) == true)
		{
			System.out.println("addGroupMember() 用户 " + userId + " 已是该组成员！");
			docSysErrorLog("用户 " + userId + " 已是该组成员！", rt);
			writeJson(rt, response);
			return;
		}
	
		if(userService.addGroupMember(groupMember) == 0)
		{
			System.out.println("addGroupMember() Failed to add groupMember");
			docSysErrorLog("Failed to add new GroupMember in DB", rt);
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}

	private boolean isGroupMemberExist(GroupMember groupMember) {
		List<UserGroup> list = userService.getGroupMemberListByGroupMemberInfo(groupMember);
		if(list == null || list.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	@RequestMapping(value="delGroupMember")
	public void delGroupMember(Integer id, HttpSession session,HttpServletResponse response)
	{
		System.out.println("delGroupMember " + id);
		
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
		
		if(userService.delGroupMember(id) == 0)
		{
			docSysErrorLog("Failed to delete GroupMember from DB", rt);
		}
		
		writeJson(rt, response);
		return;		
	}
	
	@RequestMapping(value="getSystemLog")
	public void getSystemLog(String fileName,HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception{
		System.out.println("getSystemLog: " + fileName);
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
		
		String localParentPath = getSystemLogParentPath();
		if(fileName == null || "".equals(fileName))
		{
			fileName = getSystemLogFileName();
		}
		
		sendTargetToWebPage(localParentPath,fileName, localParentPath, rt, response, request, false);
		return;		
	}
	

}
