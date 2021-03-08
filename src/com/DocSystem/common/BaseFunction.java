package com.DocSystem.common;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ReadProperties;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.constants.LICENSE_RESULT;
import com.DocSystem.commonService.ProxyThread;
import com.DocSystem.commonService.ShareThread;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSON;

public class BaseFunction{	
	//应用路径
    protected static String docSysIniPath = null;
    protected static String docSysWebPath = null;
	
    //系统License
    public static License systemLicenseInfo = null;
    //OnlyOffice License
    public static OfficeLicense officeLicenseInfo = null;

	public static ConcurrentHashMap<Integer, ConcurrentHashMap<String, DocLock>> docLocksMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<String, DocLock>>();
	protected static ConcurrentHashMap<Integer, DocLock> reposLocksMap = new ConcurrentHashMap<Integer, DocLock>();
	
	public static int OSType = OS.UNKOWN; //
    static {
    	initOSType();
    	docSysWebPath = Path.getWebPath(OSType);
		docSysIniPath = Path.getDocSysWebParentPath(docSysWebPath) + "docSys.ini/";   
    	initSystemLicenseInfo();
    	initOfficeLicenseInfo();
    }
    
	private static void initSystemLicenseInfo() {
		System.out.println("initSystemLicenseInfo() ");
		//Default systemLicenseInfo
		systemLicenseInfo = new License();
		systemLicenseInfo.type = constants.DocSys_Community_Edition;
		systemLicenseInfo.usersCount = null;	//无限制
		systemLicenseInfo.expireTime = null; //长期有效
		systemLicenseInfo.hasLicense = false;
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
		System.out.println("OSName:"+ OSName);
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
	
	public static Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum) 
	{
		Doc doc = DocUtil.buildBasicDoc(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, size, checkSum);
		doc.isBussiness = systemLicenseInfo.hasLicense;
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
		
		System.out.println("buildVDoc() doc already is VDoc");
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
    	System.out.println("syncUpForDelete() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
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
	protected static final Object syncLock = new Object(); 
	
	/****************** 路径相关的接口 *****************************************/
	//WebTmpPath was accessable for web
	protected String getWebUserTmpPath(User login_user) {
        String webUserTmpPath =  docSysWebPath +  "tmp/" + login_user.getId() + "/";
        System.out.println("getWebUserTmpPath() webUserTmpPath:" + webUserTmpPath);
		return webUserTmpPath;
	}

	protected String getWebUserTmpPath(User login_user, boolean autoCreate) {
        String webUserTmpPath =  docSysWebPath +  "tmp/" + login_user.getId() + "/";
        System.out.println("getWebUserTmpPath() webUserTmpPath:" + webUserTmpPath);
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
	    System.out.println("getWebUploadPath() webTmpPath:" + webTmpPath);
		return webTmpPath;
	}
	
	//WebTmpPath was 
	protected String getWebTmpPath() {
        String webTmpPath =  docSysWebPath +  "tmp/";
        System.out.println("getWebTmpPath() webTmpPath:" + webTmpPath);
		return webTmpPath;
	}
	
	protected String getWebTmpPathForPreview() {
        String webTmpPath =  docSysWebPath +  "tmp/preview/";
        System.out.println("getWebTmpPathForPreview() webTmpPath:" + webTmpPath);
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
	
}
