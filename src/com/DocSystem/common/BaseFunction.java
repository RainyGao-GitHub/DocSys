package com.DocSystem.common;

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
public class BaseFunction{
	
	//线程锁
	protected static final Object syncLock = new Object(); 
	
	protected String ROWS_PER_PAGE;// 每页显示的记录数
	protected String curPage;// 当前第几页
	
	/**************************** Log相关接口 ******************************/
	//To print the obj by convert it to json format
	protected void printObject(String Head,Object obj)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		System.out.println(Head + json);		
	}

	/*************************** 路径相关接口 **************************/
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

	private boolean isWinOS() {
		String os = System.getProperty("os.name"); 
		System.out.println("OS:"+ os);  
		if(os.toLowerCase().startsWith("win")){
			return true;
		}
		return false;
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

	private boolean isWinDiskStr(String Str) 
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
	
	protected String getReposPath(Repos repos) {
		String path = repos.getPath();
		return path + repos.getId() + "/";
	}
	
	//获取仓库的实文件的本地存储根路径
	protected String getReposRealPath(Repos repos)
	{
		if(repos.getType() == 2)
		{
			return repos.getRealDocPath();
		}
		String reposRPath = getReposPath(repos) + "data/rdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposRealPath() " + reposRPath);
		return reposRPath;
	}
	
	//获取仓库的虚拟文件的本地存储根路径
	protected String getReposVirtualPath(Repos repos)
	{
		String reposVPath = getReposPath(repos) + "data/vdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposVirtualPath() " + reposVPath);
		return reposVPath;
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
	
	/*********************** 权限相关接口 ************************************/
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
	
	protected HashMap<Integer,DocAuth> BuildHashMapByDocAuthList(List<DocAuth> docAuthList) {
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
	
	//获取当前登录用户信息
	protected User getCurrentUser(HttpSession session){
		User user = (User) session.getAttribute("login_user");
		System.out.println("get sessionId:"+session.getId());
		return user;
	}
	
	/**************************** 参数获取相关接口 **********************************/
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
	
	/****************************** 文件操作相关接口 ***********************************/
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
	
	//删除预览文件
	protected void deletePreviewFile(String checkSum) {
		String dstName = checkSum + ".pdf";
		String dstPath = getWebTmpPath() + "preview/" + dstName;
		delFileOrDir(dstPath);
	}


	/*************** Commont Interfaces for verRepos ***************/
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

	/*************************** DocSys文件操作接口 ***********************************/
	//create Real Doc
	protected boolean createRealDoc(String reposRPath,String parentPath, String name, Integer type, ReturnAjax rt) {
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
	
	protected boolean deleteRealDoc(String reposRPath, String parentPath, String name, Integer type, ReturnAjax rt) {
		String localDocPath = reposRPath + parentPath + name;

		if(delFileOrDir(localDocPath) == false)
		{
			System.out.println("deleteRealDoc() delFileOrDir " + localDocPath + "删除失败！");
			rt.setMsgData("deleteRealDoc() delFileOrDir " + localDocPath + "删除失败！");
			return false;
		}
		
		return true;
	}
	
	protected boolean updateRealDoc(String reposRPath,String parentPath,String name,Integer type, Integer fileSize, String fileCheckSum,
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
	
	protected boolean checkFileSizeAndCheckSum(String localDocParentPath, String name, Integer fileSize,
			String fileCheckSum) {
		File file = new File(localDocParentPath,name);
		if(fileSize != file.length())
		{
			System.out.println("checkFileSizeAndCheckSum() fileSize " + file.length() + "not match with ExpectedSize" + fileSize);
			return false;
		}
		return true;
	}

	protected boolean moveRealDoc(String reposRPath, String srcParentPath, String srcName, String dstParentPath,String dstName,Integer type, ReturnAjax rt) 
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
	
	protected boolean copyRealDoc(String reposRPath, String srcParentPath,String srcName,String dstParentPath,String dstName, Integer type, ReturnAjax rt) {
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
	protected boolean createVirtualDoc(String reposVPath, String docVName,String content, ReturnAjax rt) {
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
	
	protected boolean deleteVirtualDoc(String reposVPath, String docVName, ReturnAjax rt) {
		String localDocVPath = reposVPath + docVName;
		if(delDir(localDocVPath) == false)
		{
			rt.setMsgData("deleteVirtualDoc() delDir失败 " + localDocVPath);
			return false;
		}
		return true;
	}
	
	protected boolean moveVirtualDoc(String reposVPath, String srcDocVName,String dstDocVName, ReturnAjax rt) {
		if(moveFileOrDir(reposVPath, srcDocVName, reposVPath, dstDocVName, false) == false)
		{
			rt.setMsgData("moveVirtualDoc() moveFile " + " reposVPath:" + reposVPath + " srcDocVName:" + srcDocVName+ " dstDocVName:" + dstDocVName);
			return false;
		}
		return true;
	}
	
	protected boolean copyVirtualDoc(String reposVPath, String srcDocVName, String dstDocVName, ReturnAjax rt) {
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
	
	/*************** DocSys verRepos操作接口 *********************/
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
	
	protected List<LogEntry> gitGetHistory(Repos repos, boolean isRealDoc, String docPath, int maxLogNum) {
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		return gitUtil.getHistoryLogs(docPath, null, null, maxLogNum);
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
	
	protected boolean verReposRealDocAdd(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
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

	protected boolean svnRealDocCommit(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
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
	
	protected boolean gitRealDocAdd(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
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
	
	protected boolean verReposRealDocDelete(Repos repos, String parentPath, String entryName,Integer type,
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

	protected boolean verReposRealDocCommit(Repos repos, String parentPath, String entryName,Integer type,
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

	protected boolean verReposRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
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

	protected boolean verReposRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
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
	
	protected boolean verReposRevertRealDoc(Repos repos, String parentPath,String entryName, Integer type, ReturnAjax rt) 
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
	
	protected boolean verReposVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) 
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
	
	protected boolean verReposVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) 
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

	protected boolean verReposVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
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

	protected boolean verReposVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) 
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

	protected boolean verReposVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) 
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

	protected boolean verReposRevertVirtualDoc(Repos repos, String docVName) {
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
	
	//Git realDoc Delete
	protected boolean gitRealDocDelete(Repos repos, String parentPath, String entryName, Integer type, String commitMsg,String commitUser, ReturnAjax rt) {
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
	
	protected boolean gitRealDocCommit(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
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
	
	protected boolean gitRealDocMove(Repos repos, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {	
		
		return gitDocMove(repos, true, srcParentPath, srcEntryName, dstParentPath,dstEntryName, commitMsg, commitUser, rt);
	}
	
	protected boolean gitRealDocCopy(Repos repos, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		return  gitDocCopy(repos, true, srcParentPath, srcEntryName, dstParentPath, dstEntryName,  commitMsg, commitUser, rt);
	}
	
	protected boolean gitDocMove(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
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
	
	protected boolean gitDocCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
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

	protected boolean gitCheckOut(Repos repos, boolean isRealDoc, String parentPath, String entryName, String localParentPath, String targetName, String revision) {
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
	
	protected boolean gitRevertRealDoc(Repos repos, String parentPath, String entryName, Integer type, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("gitRevertRealDoc() parentPath:" + parentPath + " entryName:" + entryName);
		String localParentPath = getReposRealPath(repos) + parentPath;

		//revert from svn server
		return gitCheckOut(repos, true, parentPath, entryName, localParentPath, entryName,null);
	}
		
	protected boolean gitVirtualDocAdd(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
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
	
	protected boolean gitVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser,
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
	
	protected boolean gitVirtualDocCommit(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
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

	protected boolean gitVirtualDocMove(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,
			String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return gitDocMove(repos, false, "", srcDocVName, "", dstDocVName, commitMsg, commitUser, rt);
	}
	
	protected boolean gitVirtualDocCopy(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,
			String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return  gitDocCopy(repos, false, "", srcDocVName, "", dstDocVName,  commitMsg, commitUser, rt);
	}
	
	protected boolean gitRevertVirtualDoc(Repos repos, String docVName) {
		// TODO Auto-generated method stub
		System.out.println("svnRevertRealDoc() docVName:" + docVName);
		String localParentPath = getReposVirtualPath(repos);

		//revert from svn server
		return gitCheckOut(repos, false, "", docVName, localParentPath, docVName,null);
	}
	
	/********************** Functions for SVN ***************************/
	protected boolean svnRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
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
	
	protected boolean svnCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,String dstEntryName, 
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
	
	protected boolean svnMove(Repos repos, boolean isRealDoc, String srcParentPath,String srcEntryName, String dstParentPath,String dstEntryName, 
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

	protected boolean svnRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnRealDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
			
		if(svnCopy(repos, true, srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg,commitUser,rt) == false)
		{
			System.out.println("文件: " + srcEntryName + " svnCopy失败");
			return false;
		}
		return true;
	}

	protected boolean svnCheckOut(Repos repos, boolean isRealDoc, String parentPath,String entryName, String localParentPath,String targetName,long revision) 
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

	protected boolean svnRevertRealDoc(Repos repos, String parentPath,String entryName, Integer type, ReturnAjax rt) 
	{
		System.out.println("svnRevertRealDoc() parentPath:" + parentPath + " entryName:" + entryName);
		String localParentPath = getReposRealPath(repos) + parentPath;

		//revert from svn server
		return svnCheckOut(repos, true, parentPath, entryName, localParentPath, entryName,-1);
	}

	protected boolean svnVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		
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

	protected boolean svnVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
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

	protected boolean svnVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
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

	protected boolean svnVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocMove() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);
		if(svnMove(repos, false,"",srcDocVName,"",dstDocVName,commitMsg,commitUser, rt) == false)
		{
			System.out.println("svnMove Failed！");
			rt.setMsgData("svnVirtualDocMove() svnMove Failed！");
			return false;
		}
		return true;
	}

	protected boolean svnVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) {

		System.out.println("svnVirtualDocCopy() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);			
		if(svnCopy(repos, false, "",srcDocVName,"",dstDocVName,commitMsg,commitUser,rt) == false)
		{
			System.out.println("文件: " + srcDocVName + " svnCopy失败");
			return false;
		}
		return true;
	}

	protected boolean svnRevertVirtualDoc(Repos repos, String docVName) {
		System.out.println("svnRevertVirtualDoc() docVName:" + docVName);
		
		String localDocVParentPath = getReposVirtualPath(repos);

		return svnCheckOut(repos, false, "", docVName, localDocVParentPath, docVName,-1);
	}
	
	protected String commitMsgFormat(String commitMsg, String commitUser) {
		commitMsg = commitMsg + " by [" + commitUser + "] ";
		return commitMsg;
	}
	
	protected Integer convertSVNNodeKindToEntryType(SVNNodeKind nodeKind) {
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
	
	protected boolean gitAutoCommit(Repos repos,boolean isRealDoc,String parentPath, String entryName, String localParentPath, String localEntryName, 
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
