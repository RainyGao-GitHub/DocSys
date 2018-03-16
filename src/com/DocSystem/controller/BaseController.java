package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.fileupload.FileUploadException;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.Zip;
import org.apache.tools.ant.types.FileSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNNodeKind;

import util.CompressPic;
import util.DateFormat;
import util.ReturnAjax;
import util.UUid;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.User;
import com.DocSystem.entity.UserGroup;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;
import com.alibaba.fastjson.JSON;

import util.Base64File;
import util.Encrypt.MD5;
@SuppressWarnings("rawtypes")
public class BaseController{
	@Autowired
	private ReposServiceImpl reposService;
	@Autowired
	private UserServiceImpl userService;
	
	protected Map session;
	protected static String SUCCESS = "success";
	protected static String FAIL = "fail";
	protected static String BASE_PAGE_PATH = "web";
//	protected String rows;// 每页显示的记录数
//	protected String page;// 当前第几页
	
	protected static String[] IMGALLOWDTYPES = {"JPG","JPEG","PNG","GIF","BMP"};
	
	public static String uploadBasePath = "";


	/***************************Basic Functions For Application Level  **************************/
	//获取仓库的实文件的本地存储根路径
	protected String getReposRealPath(Repos repos)
	{
		String reposRPath = repos.getPath() + repos.getId() + "/data/rdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposRealPath() " + reposRPath);
		return reposRPath;
	}

	//获取仓库的LastVersion实文件的本地存储根路径
	protected String getReposRefRealPath(Repos repos)
	{
		String reposRPath = repos.getPath() + repos.getId() + "/refData/rdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposRealRefPath() " + reposRPath);
		return reposRPath;
	}
	
	//获取仓库的虚拟文件的本地存储根路径
	protected String getReposVirtualPath(Repos repos)
	{
		String reposVPath = repos.getPath() + repos.getId() + "/data/vdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposVirtualPath() " + reposVPath);
		return reposVPath;
	}

	//获取仓库的LastVersion虚拟文件的本地存储根路径
	protected String getReposRefVirtualPath(Repos repos)
	{
		String reposVPath = repos.getPath() + repos.getId() + "/refData/vdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposVirtualRefPath() " + reposVPath);
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
	
	protected String getDocVPath(String parentPath,String docName) 
	{
		String HashValue = MD5.md5(parentPath) + "_" + docName;
		System.out.println("getDocVPath() " + HashValue + " for " + parentPath + docName);
		return HashValue;
	}
	
	protected String getReposUserTmpPath(Repos repos, User login_user) {
		String reposTmpVirtualPath = repos.getPath() + repos.getId() +  "/tmp/" + login_user.getId() + "/";
		return reposTmpVirtualPath;
	}
	
	//获取用户真正的权限：权限已经考虑了继承用户组权限和任意用户权限
	public ReposAuth getUserRealReposAuth(Integer UserID,Integer ReposID)
	{
		List <UserGroup> groupList = getGroupListForUser(UserID);
		return getUserReposAuth(UserID,groupList,ReposID);
	}
	
	//获取用户组真正的权限：权限以及考虑继承了任意用户
	public ReposAuth getGroupRealReposAuth(Integer GroupID,Integer ReposID)
	{
		List <UserGroup> groupList = getGroupListForGroup(GroupID);
		return getUserReposAuth(0,groupList,ReposID);
	}
	
	//获取用户真正的权限 From Bottom To Top
	public DocAuth getUserRealDocAuth(Integer UserID,Integer DocID,Integer ReposID)
	{
		List <UserGroup> groupList = getGroupListForUser(UserID);
		return getUserDocAuth(UserID,groupList,DocID,ReposID);
	}
	
	//获取用户组真正的权限 From Bottom To Top
	public DocAuth getGroupRealDocAuth(Integer GroupID,Integer DocID,Integer ReposID)
	{
		List <UserGroup> groupList = getGroupListForGroup(GroupID);
		return getUserDocAuth(0,groupList,DocID,ReposID);
	}
	
	//获取用户真正的权限 From Top To Bottom（该接口只应用于展示用户可见目录或可见管理目录，用于减少查询次数，提高效率）
	public DocAuth getUserRealDocAuthT2B(Integer UserID,Integer DocID, Integer ReposID, DocAuth parentDocAuth)
	{
		//Get groupList
		List <UserGroup> groupList = getGroupListForUser(UserID);
		
		//Get the userDocAuthList\groupDocAuthList\anyUserDocAuthList
		//获取user在仓库下的所有权限设置，避免后续多次查询数据库
		List <DocAuth> userDocAuthList = getDocAuthListForUser(UserID,ReposID);
		//get groupDocAuthList
		List <DocAuth> groupDocAuthList = getDocAuthListForGroups(groupList,ReposID);
		//Get AnyUserDocAuthList
		List <DocAuth> anyUserDocAuthList = getDocAuthListForUser(0,ReposID);
		
		return getDocAuthFromList(DocID,parentDocAuth,userDocAuthList, groupDocAuthList, anyUserDocAuthList); 
	}
	
	protected List<UserGroup> getGroupListForUser(Integer userID) 
	{
		// TODO Auto-generated method stub
		return null;
	}
	
	private List<UserGroup> getGroupListForGroup(Integer groupID) {
		// TODO Auto-generated method stub
		return null;
	}

	//Function:getUserReposAuth
	//Parameters:
	//	userId: 用户ID
	//	groupList: 用户所在的groups
	//Description: 该接口用户获取用户的实际仓库权限，有三种情况：
	//		case 1: userId > 0   递归获取用户的权限，递归获取组权限，递归获取任意用户的权限（用途：用于用户访问权限控制，和仓库权限管理时使用）
	//		case 2: userId = 0  递归获取组权限，递归获取任意用户的权限（用途：用于计算组的权限或者任意用户的权限，主要在仓库权限管理时使用）
	//		case 3: userId == null 递归获取组权限（似乎没有使用场景）
	protected ReposAuth getUserReposAuth(Integer UserID,List <UserGroup> groupList,Integer ReposID)
	{
		//Try to get the userReposAuth
		ReposAuth reposAuth = getReposAuthForUser(UserID, ReposID);
		if(reposAuth != null)
		{
			reposAuth.setType(1);
			return reposAuth;
		}
		
		//Try to get the groupReposAuth
		reposAuth = getReposAuthForGroups(groupList,ReposID);
		if(reposAuth != null)
		{
			reposAuth.setType(2);
			return reposAuth;
		}
		
		//Try to get any UserReposAuth
		reposAuth = getReposAuthForUser(0, ReposID);
		if(reposAuth != null)
		{
			reposAuth.setType(3);
			return reposAuth;
		}
		return null;
	}

	
	private ReposAuth getReposAuthForUser(Integer UserID,Integer reposID) 
	{
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setReposId(reposID);
		qReposAuth.setUserId(UserID);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		return reposAuth;		
	}
	
	private ReposAuth getReposAuthForGroups(List<UserGroup> groupList,Integer reposID) {
		// go Through the groupList to get all reposAuth
		List <ReposAuth> reposAuthList = new ArrayList<ReposAuth>();
		for(int i=0;i<groupList.size();i++)
		{
			UserGroup group = groupList.get(i);
			Integer groupId = group.getId();
			ReposAuth qReposAuth = new ReposAuth();
			qReposAuth.setReposId(reposID);
			qReposAuth.setGroupId(groupId);
			ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
			if(reposAuth!=null)
			{
				reposAuthList.add(reposAuth);
			}
		}
		
		// caculate the really reposAuth
		if(reposAuthList.size() == 0)
		{
			return null;
		}
		
		ReposAuth groupReposAuth = reposAuthList.get(0);
		for(int i = 1;i<reposAuthList.size();i++)
		{
			ReposAuth tmpReposAuth = reposAuthList.get(i);
			if(tmpReposAuth.getIsAdmin().equals(1))
			{
				groupReposAuth.setIsAdmin(1);
			}
			if(tmpReposAuth.getAccess().equals(1))
			{
				groupReposAuth.setAccess(1);
			}
			if(tmpReposAuth.getAddEn().equals(1))
			{
				groupReposAuth.setAddEn(1);
			}
			if(tmpReposAuth.getDeleteEn().equals(1))
			{
				groupReposAuth.setDeleteEn(1);
			}
			if(tmpReposAuth.getEditEn().equals(1))
			{
				groupReposAuth.setEditEn(1);
			}
			if(tmpReposAuth.getHeritable().equals(1))
			{
				groupReposAuth.setHeritable(1);
			}			
		}
		return groupReposAuth;
	}
	
	//Function:getUserDocAuth 
	//Parameters:
	//	userId: 用户ID
	//	groupList: 用户所在的groups
	//Description: 该接口用户获取用户的实际仓库权限，有三种情况：
	//		case 1: userId > 0   递归获取用户的权限，递归获取组权限，递归获取任意用户的权限（用途：用于用户访问权限控制，和仓库权限管理时使用）
	//		case 2: userId = 0  递归获取组权限，递归获取任意用户的权限（用途：用于计算组的权限或者任意用户的权限，主要在仓库权限管理时使用）
	//		case 3: userId == null 递归获取组权限（似乎没有使用场景）
	protected DocAuth getUserDocAuth(Integer userId,List <UserGroup> groupList, Integer docId, Integer reposId) 
	{
		//Get the userDocAuthList\groupDocAuthList\anyUserDocAuthList
		//获取user在仓库下的所有权限设置，避免后续多次查询数据库
		List <DocAuth> userDocAuthList = getDocAuthListForUser(userId,reposId);
		//get groupDocAuthList
		List <DocAuth> groupDocAuthList = getDocAuthListForGroups(groupList,reposId);
		//Get AnyUserDocAuthList
		List <DocAuth> anyUserDocAuthList = getDocAuthListForUser(0,reposId);
		
		if(userDocAuthList == null && groupDocAuthList == null && anyUserDocAuthList == null)
		{
			System.out.println("getUserDocAuth() 用户无权访问该仓库的所有文件");
			return null;
		}
		
		//Get UserDocAuth	
		DocAuth docAuth = null;
		if(userId !=null && userId > 0)
		{
			docAuth = recurGetDocAuth(docId,userDocAuthList);
			if(docAuth != null)
			{
				//如果获取的是本parentDoc的权限，则需要判断是否支持继承
				if(!docId.equals(docAuth.getDocId()) && docAuth.getHeritable() == 0)
				{
					return null;
				}
				else
				{
					docAuth.setType(1);
					return docAuth;
				}
			}
		}
		
		//Get GroupDocAuth
		if(docAuth == null)
		{
			if(groupList != null)
			{
				docAuth = recurGetDocAuth(docId,groupDocAuthList);
				if(docAuth != null)
				{
					//如果获取的是本parentDoc的权限，则需要判断是否支持继承
					if(!docId.equals(docAuth.getDocId()) && docAuth.getHeritable() == 0)
					{
						return null;
					}
					else
					{
						docAuth.setType(2);
						return docAuth;
					}
				}
			}
		}
		
		//Get AnyUserDocAuth
		if(docAuth == null)
		{
			if(userId != null)
			{
				docAuth = recurGetDocAuth(docId,anyUserDocAuthList);
				if(docAuth != null)
				{
					//如果获取的是本parentDoc的权限，则需要判断是否支持继承
					if(!docId.equals(docAuth.getDocId()) && docAuth.getHeritable() == 0)
					{
						return null;
					}
					else
					{
						docAuth.setType(3);
						return docAuth;
					}
				}
			}
		}
		return docAuth;
	}

	//Function: getDocAuthFromList
	//Parameters: 
	//	docId: doc Id
	//	parentDocAuth: docAuth of parentDoc
	//	docAuthList: docAuth Setting of user group and anyUser
	//Description: 该接口能够快速获取当前doc的权限，不需要再查询数据库，但需要事先知道其父节点的权限，以及提前取出用户在仓库上的所有文件的权限设置信息
	protected DocAuth getDocAuthFromList(int docId, DocAuth parentDocAuth,
			List<DocAuth> userDocAuthList, List<DocAuth> groupDocAuthList,List<DocAuth> anyUserDocAuthList) {
		
		System.out.println("getDocAuthFromList() docId:" + docId);
		
		DocAuth docAuth = null;
		//root Doc
		if(docId == 0)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setType(1);
			}
			else
			{
				docAuth = getDocAuthByDocId(docId,groupDocAuthList);
				if(docAuth != null)
				{
					docAuth.setType(2);					
				}
				else
				{
					docAuth = getDocAuthByDocId(docId,anyUserDocAuthList);
					if(docAuth != null)
					{
						docAuth.setType(2);					
					}
				}
			}
			return docAuth;
		}
		
		//Not root Doc, if parentDocAuth is null, return null
		if(parentDocAuth == null)
		{
			System.out.println("getDocAuthFromList() docId:" + docId + " parentDocAuth is null");
			return null;
		}
		
		//Not root Doc and parentDocAuth is set
		docAuth = null;
		Integer pDocAuthType = parentDocAuth.getType();
		if(pDocAuthType == 1)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setType(1);
			}
			else if(docAuth == null && parentDocAuth.getHeritable() == 1)
			{
				docAuth = parentDocAuth;
			}
		}
		else if(pDocAuthType == 2)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setType(1);
			}
			else
			{
				docAuth = getDocAuthByDocId(docId,groupDocAuthList);
				if(docAuth != null)
				{
					docAuth.setType(2);
				}
				else if(docAuth == null && parentDocAuth.getHeritable() == 1)
				{
					docAuth = parentDocAuth;
				}
			}
		}
		else if(pDocAuthType == 3)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setType(1);
			}
			else
			{
				docAuth = getDocAuthByDocId(docId,groupDocAuthList);
				if(docAuth != null)
				{
					docAuth.setType(2);
				}
				else
				{
					docAuth = getDocAuthByDocId(docId,groupDocAuthList);
					if(docAuth != null)
					{
						docAuth.setType(3);
					}					
					else if(docAuth == null && parentDocAuth.getHeritable() == 1)
					{
						docAuth = parentDocAuth;
					}
				}
			}
		}
		return docAuth;
	}

	//getDocAuth from the bottom to top
	private DocAuth recurGetDocAuth(Integer docId,List<DocAuth> docAuthList) {
		DocAuth docAuth = getDocAuthByDocId(docId,docAuthList);
		if(docAuth == null)
		{
			Doc doc = reposService.getDoc(docId);
			if(doc == null)
			{
				System.out.println("recurGetDocAuth: doc with ID " + docId + "不存在！");
				return null;
			}
			Integer pDocId = doc.getPid();
			return recurGetDocAuth(pDocId,docAuthList);
		}
		return docAuth;
	}
	
	//根据DocId从docAuthList中找出对应的docAuth
	private DocAuth getDocAuthByDocId(Integer docId,List<DocAuth> docAuthList) 
	{
			if(docAuthList == null)
			{
				return null;
			}
			
			for(int i = 0 ; i < docAuthList.size() ; i++) 
			{
				DocAuth docAuth = docAuthList.get(i);
				if(docId.equals(docAuth.getDocId()))
				{
					//如果需要优化的话，可以考虑把已经找到的docAuth从docAuthList中删除，从而提高下一个doc的筛选速度
					return docAuth;
				}
			}
			return null;
	}
	
	//获取用户在仓库上所有doc的权限设置
	protected List<DocAuth> getDocAuthListForUser(Integer UserID,Integer reposID) 
	{
		List <DocAuth> userDocAuthList = reposService.getUserDocAuthList(UserID,null,null,reposID);
		return userDocAuthList;
	}
	
	//获取用户组在仓库上所有doc的权限设置（权限设置为所有group的并集-每个docId只有一个docAuth设置）
	protected List<DocAuth> getDocAuthListForGroups(List<UserGroup> groupList,Integer reposId) 
	{
		if(groupList == null)
		{
			return null;
		}
		
		//Go through the GroupList to get the docAuthList for group one by one
		List <DocAuth> tmpGroupDocAuthList = new ArrayList<DocAuth>();
		for(int i=0;i<groupList.size();i++)
		{
			UserGroup group = groupList.get(i);
			Integer groupId = group.getId();
			DocAuth qDocAuth = new DocAuth();
			qDocAuth.setReposId(reposId);
			qDocAuth.setGroupId(groupId);
			List<DocAuth> docAuthList = reposService.getDocAuthList(qDocAuth);
			if(docAuthList!=null)
			{
				tmpGroupDocAuthList.addAll(docAuthList);
			}
		}
		
		//To Generate the real groupDocAuthList base on tmpGroupDocAuthList, need to combine the docAuth which have the same docId
		if(tmpGroupDocAuthList.size() == 0)
		{
			return null;
		}
		
		List <DocAuth> groupDocAuthList = new ArrayList<DocAuth>();
		for(int i = 1;i<tmpGroupDocAuthList.size();i++)
		{
			DocAuth tmpDocAuth = tmpGroupDocAuthList.get(i);
			//Check if there is docAuth in groupDocAuthList with the same docId
			int matchedFlag = 0;
			for(int j=0;j<groupDocAuthList.size();j++)
			{
				DocAuth groupDocAuth = groupDocAuthList.get(j);
				if(groupDocAuth.getDocId().equals(tmpDocAuth.getDocId()))
				{
					matchedFlag = 1;
					if(tmpDocAuth.getIsAdmin().equals(1))
					{
						groupDocAuth.setIsAdmin(1);
					}
					if(tmpDocAuth.getAccess().equals(1))
					{
						groupDocAuth.setAccess(1);
					}
					if(tmpDocAuth.getAddEn().equals(1))
					{
						groupDocAuth.setAddEn(1);
					}
					if(tmpDocAuth.getDeleteEn().equals(1))
					{
						groupDocAuth.setDeleteEn(1);
					}
					if(tmpDocAuth.getEditEn().equals(1))
					{
						groupDocAuth.setEditEn(1);
					}
					if(tmpDocAuth.getHeritable().equals(1))
					{
						groupDocAuth.setHeritable(1);
					}			
					break;
				}
				
				if(matchedFlag == 0)
				{
					groupDocAuthList.add(tmpDocAuth);
				}
			}
			
		}
		return groupDocAuthList;
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
		InputStream in;
		try {
			in = new FileInputStream(config);
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
    
    public boolean copyFile1(String oldPath, String newPath) { 
    	try { 
    		int bytesum = 0; 
    		int byteread = 0; 
    		File oldfile = new File(oldPath); 
    		if (oldfile.exists()) { //文件存在时 
    				InputStream inStream = new FileInputStream(oldPath); //读入原文件 
    				FileOutputStream fs = new FileOutputStream(newPath); 
    				byte[] buffer = new byte[1444]; 
    				//int length; 
    				while ( (byteread = inStream.read(buffer)) != -1) { 
    					bytesum += byteread; //字节数 文件大小 
    					System.out.println(bytesum); 
    					fs.write(buffer, 0, byteread); 
    				} 
    				inStream.close();
    				return true;
    		} 
    	} 
    	catch (Exception e) { 
    		System.out.println("复制单个文件操作出错"); 
    		e.printStackTrace(); 
    	}
    	return false;
    }
    
    public boolean copyFile(String srcFilePath,String dstFilePath,boolean cover) throws IOException{
        File dstFile=new File(dstFilePath);
        if(!dstFile.exists())
        {
        	dstFile.createNewFile();
        }
        else
        {
        	if(cover == false)
        	{
        		//不允许覆盖
        		System.out.println(dstFilePath + " 已存在!");
        		return false;
        	}
        }
        
        FileInputStream in=new FileInputStream(srcFilePath);
        FileOutputStream out=new FileOutputStream(dstFilePath);
        int c;
        byte buffer[]=new byte[1024];
        while((c=in.read(buffer))!=-1){
            for(int i=0;i<c;i++)
                out.write(buffer[i]);        
        }
        in.close();
        out.close();
        return true;
    }
    
    /** 
    * 复制整个文件夹内容 
    * @param oldPath String 原文件路径 如：c:/fqf 
    * @param newPath String 复制后路径 如：f:/fqf/ff 
    * @return boolean 
    */ 
    public boolean copyFolder(String oldPath, String newPath) 
    {
	    try {
	    	//Check the newPath
	    	File newFile = new File(newPath);
	    	if(newFile.exists() == false)
	    	{
	    		//mkdirs will create the no exists parent dir, so I use the mkdir
	    		if(newFile.mkdir() == false)
	    		{
	    			System.out.println("copyFolder() Failed to create dir:"+newPath);
	    			return false;
	    		}
	    	}
	    	//Check the oldPath
	    	File a=new File(oldPath); 
		    String[] file=a.list(); 
		    File temp=null; 
		    for (int i = 0; i < file.length; i++) 
		    { 
		    	if(oldPath.endsWith(File.separator))
		    	{ 
		    		temp=new File(oldPath+file[i]); 
		    	} 
		    	else
		    	{ 
		    		temp=new File(oldPath+File.separator+file[i]); 
		    	} 
		    	
		    	if(temp.isFile())
		    	{ 
		    		FileInputStream input = new FileInputStream(temp); 
		    		FileOutputStream output = new FileOutputStream(newPath + "/" + (temp.getName()).toString()); 
		    		byte[] b = new byte[1024 * 5]; 
		    		int len; 
		    		while ( (len = input.read(b)) != -1) { 
		    			output.write(b, 0, len); 
		    		} 
		    		output.flush(); 
		    		output.close(); 
		    		input.close(); 
		    	} 
		    	if(temp.isDirectory()){//如果是子文件夹 
		    		copyFolder(oldPath+"/"+file[i],newPath+"/"+file[i]); 
		    	} 
		    } 
	    } 
	    catch (Exception e) 
	    { 
	    	System.out.println("复制整个文件夹内容操作出错"); 
	    	e.printStackTrace(); 
	    	return false;
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
			return copyFolder(srcPath,dstPath);
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
	
    //Move File
    public boolean moveFile(String oldpath,String oldName,String newpath,String newName,boolean cover){
    	
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
    public boolean delFile(String path,String filename){
        File file=new File(path+"/"+filename);
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
    
    //Delete File and Directory with path
    //该接口不会去影响其子节点
    public boolean deleteFile(String path){
        File file=new File(path);
        if(file.exists()){
        	return file.delete();	
        }
        System.out.println(path + " 不存在！");
        return false;
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
	
    //检查文件是否存在
    public boolean isFileExist(String path){
    	File file=new File(path);
        return file.exists();
    }
    
	public String saveFile(MultipartFile srcFile,String path,String fileName)throws Exception{
		
		long fileSize = srcFile.getSize();
		if(fileSize==0){
			System.out.println("saveFile() fileSize 0");
			//return null;
		}
		
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


}
