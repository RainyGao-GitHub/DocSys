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
import java.net.URLEncoder;
import java.nio.channels.FileChannel;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Properties;
import java.util.Scanner;
import java.util.Map.Entry;

import javax.naming.AuthenticationException;
import javax.naming.CommunicationException;
import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.directory.Attribute;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.compress.archivers.sevenz.SevenZArchiveEntry;
import org.apache.commons.compress.archivers.sevenz.SevenZFile;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;
import org.apache.commons.httpclient.util.HttpURLConnection;
import org.apache.ibatis.jdbc.ScriptRunner;
import org.apache.tools.tar.TarEntry;
import org.apache.tools.tar.TarInputStream;
import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipFile;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNDirEntry;
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
import com.DocSystem.common.RunResult;
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
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.QueryResult;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.DocShare;
import com.DocSystem.entity.GroupMember;
import com.DocSystem.entity.LogEntry;
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
import com.jcraft.jzlib.GZIPInputStream;

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
        
	//系统默认用户
    protected static User coEditUser = new User();
    protected static User autoSyncUser = new User();
    
    static {		
		initSystemUsers();
    }
	private static void initSystemUsers() {
		//自动同步用户
		autoSyncUser.setId(0);
		autoSyncUser.setName("AutoSync");		
		
		//协同编辑用户
		coEditUser.setId(-1);
		coEditUser.setName("CoEditUser");		
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
				System.out.println("checkSystemUsersCount() 用户数量已达到上限，请购买商业授权证书！");
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
	
	public static ConcurrentHashMap<String, AuthCode> authCodeMap = new ConcurrentHashMap<String, AuthCode>();
	protected static AuthCode generateAuthCode(String usage, long duration, int maxUseCount, ReposAccess reposAccess) {
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
		    	authCodeMap.remove(deleteList.get(i));
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
		authCodeMap.put(code, authCode);
		return authCode;
	}
	
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
		System.out.println("checkAuthCode() authCode:" + code);
		AuthCode authCode = authCodeMap.get(code);
		if(authCode == null || authCode.getUsage() == null || authCode.getExpTime() == null || authCode.getRemainCount() == null)
		{
			System.out.println("checkAuthCode() 无效授权码");
			return false;
		}
		
		if(expUsage != null)
		{
			System.out.println("checkAuthCode() usage:" + authCode.getUsage() + " expUsage:" + expUsage);				
			if(!expUsage.equals(authCode.getUsage()))
			{
				System.out.println("checkAuthCode() usage not matched");				
				return false;
			}			
		}
		
		
		Integer remainCount = authCode.getRemainCount();
		if(remainCount == 0)
		{
			System.out.println("checkAuthCode() 授权码使用次数为0");
			authCodeMap.remove(code);
			return false;	
		}
		
		long curTime = new Date().getTime();
		if(curTime > authCode.getExpTime())
		{
			System.out.println("checkAuthCode() 授权码已过期");
			authCodeMap.remove(code);
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
			if(checkAuthCode(authCode,"docSysInit") == true)
			{
				return true;
			}
			Log.docSysErrorLog("无效授权码或授权码已过期！", rt);
			return false;
		}
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			Log.docSysErrorLog("用户未登录，请先登录！", rt);
			return false;
		}
				
		if(login_user.getType() < role)
		{
			Log.docSysErrorLog("您无权进行此操作，请联系统管理员！", rt);
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
		//System.out.println("getAccessableSubDocList() " + doc.getDocId() + " " + doc.getPath() + doc.getName() );
						
		List<Doc> docList = getAuthedSubDocList(repos, doc, docAuth, docAuthHashMap, rt);
	
		if(docList != null)
		{
			Collections.sort(docList);
		
			//Log.printObject("getAccessableSubDocList() docList:", docList);
		}		
		return docList;
	}

	//getSubDocHashMap will do get HashMap for subDocList under pid,
	protected List<Doc> getAuthedSubDocList(Repos repos, Doc doc, DocAuth pDocAuth, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt)
	{
		List<Doc> docList = new ArrayList<Doc>();
		List<Doc> tmpDocList = docSysGetDocList(repos, doc);

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

	protected List<Doc> docSysGetDocList(Repos repos, Doc doc) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
			return getLocalEntryList(repos, doc);
		case 3:
		case 4:
			return getRemoteEntryList(repos, doc);
		}
		return null;
	}
	
	private List<Doc> getLocalEntryList(Repos repos, Doc doc) 
	{
		//System.out.println("getLocalEntryList() " + doc.getDocId() + " " + doc.getPath() + doc.getName());
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
	    		//System.out.println("getLocalEntryList() " + doc.getPath() + docName + " 不存在！");
	    		return null;
	    	}
	    	
	    	if(dir.isFile())
	    	{
	    		//System.out.println("getLocalEntryList() " + doc.getPath() + docName + " 不是目录！");
	    		return null;
	    	}
	
			String subDocParentPath = doc.getPath() + docName + "/";
			if(docName.isEmpty())
			{
				subDocParentPath = doc.getPath();
			}
			
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
	    		//System.out.println("getLocalEntryList subFile:" + name);
	
	    		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), reposPath, subDocParentPath, name, subDocLevel, type, true, localRootPath, localVRootPath, size, "");
	    		subDoc.setLatestEditTime(file.lastModified());
	    		subDoc.setCreateTime(file.lastModified());
	    		subEntryList.add(subDoc);
	    	}
	    	return subEntryList;
    	}catch(Exception e){
    		System.out.println("getLocalEntryList() Excepiton for " + doc.getDocId() + " " + doc.getPath() + doc.getName());    		
    		e.printStackTrace();
    		return null;
    	}
	}

	protected Integer getSubDocLevel(Doc doc) {
		if(doc.getLevel() == null)
		{
			doc.setLevel(Path.getLevelByParentPath(doc.getPath()));
		}
		
		return doc.getLevel() + 1;
	}

	protected Integer getParentDocLevel(Doc doc) {
		if(doc.getLevel() == null)
		{
			doc.setLevel(Path.getLevelByParentPath(doc.getPath()));
		}
		
		return doc.getLevel() - 1;
	}

	private List<Doc> getRemoteEntryList(Repos repos, Doc doc) {
		//System.out.println("getRemoteEntryList() " + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");

		switch(repos.getVerCtrl())
		{
		case 1:	//SVN
			SVNUtil svnUtil = new SVNUtil();
			if(false == svnUtil.Init(repos, true, null))
			{
				System.out.println("getRemoteEntryList() svnUtil.Init Failed");
				return null;
			}
			
			//Get list from verRepos
			return svnUtil.getDocList(repos, doc, null); 
		case 2:	//GIT
			
			GITUtil gitUtil = new GITUtil();
			if(false == gitUtil.Init(repos, true, null))
			{
				System.out.println("getRemoteEntryList() gitUtil.Init Failed");
				return null;
			}
			
			//Get list from verRepos
			return gitUtil.getDocList(repos, doc, null); 
		}
		return null;
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
	    			//System.out.println("isDirLocalChanged() 本地文件删除: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
	    			return true;
	    		}
	    		
	    		if(!subLocalEntry.getType().equals(subDoc.getType()))
	    		{
	    			//System.out.println("isDirLocalChanged() 本地文件类型变化: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
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
	    			//System.out.println("isDirLocalChanged() 本地文件内容修改: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
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
    			//System.out.println("isDirLocalChanged() local Doc Added: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
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
			System.out.println("isDocLocalChanged() dbDoc is null"); 			
			return true;
		}
		
		//文件大小变化了则一定是变化了
		if(!dbDoc.getSize().equals(localEntry.getSize()))
		{
			System.out.println("isDocLocalChanged() local changed: dbDoc.size:" + dbDoc.getSize() + " localEntry.size:" + localEntry.getSize()); 
			return true;			
		}
				
		//如果日期和大小都没变表示文件没有改变
		if(!dbDoc.getLatestEditTime().equals(localEntry.getLatestEditTime()))
		{
			
			System.out.println("isDocLocalChanged() local changed: dbDoc.lastEditTime:" + dbDoc.getLatestEditTime() + " localEntry.lastEditTime:" + localEntry.getLatestEditTime()); 
			return true;
		}
		
		//如果仓库带有版本管理，那么revision未设置则认为文件本地有修改
		if(repos.getVerCtrl() == 1 || repos.getVerCtrl() == 2)
		{
			if(dbDoc.getRevision() == null || dbDoc.getRevision().isEmpty())
			{
				System.out.println("isDocLocalChanged() local changed: dbDoc.revision is null or empty:" + dbDoc.getRevision()); 
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
		
		//System.out.println("isDocRemoteChanged() remote changed: dbDoc.revision:" + dbDoc.getRevision() + " remoteEntry.revision:" + remoteEntry.getRevision()); 
		//Log.printObject("isDocRemoteChanged() doc:",dbDoc);
		//Log.printObject("isDocRemoteChanged() remoteEntry:",remoteEntry);
		return true;
	}

	protected HashMap<String, Doc> getIndexHashMap(Repos repos, Long pid, String path) 
	{
		System.out.println("getIndexHashMap() path:" + path); 
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
		//System.out.println("getDocListFromRootToDoc() reposId:" + repos.getId() + " parentPath:" + doc.getPath() +" docName:" + doc.getName());
				
		List<Doc> resultList = getAccessableSubDocList(repos, rootDoc, rootDocAuth, docAuthHashMap, rt);	//get subDocList under root
		if(resultList == null || resultList.size() == 0)
		{
			//System.out.println("getDocListFromRootToDoc() docList under root is empty");			
			return null;
		}
		
		String relativePath = getRelativePath(doc, rootDoc);
		System.out.println("getDocListFromRootToDoc() relativePath:" + relativePath);		
		if(relativePath == null || relativePath.isEmpty())
		{
			return resultList;
		}
		
		String [] paths = relativePath.split("/");
		int deepth = paths.length;
		//System.out.println("getDocListFromRootToDoc() deepth:" + deepth); 
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
			System.out.println("name:" + name);
			if(name.isEmpty())
			{
				continue;
			}	
			
			Doc tempDoc = buildBasicDoc(reposId, null, pid, doc.getReposPath(), pPath, name, pLevel+1, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
			DocAuth docAuth = getDocAuthFromHashMap(doc.getDocId(), pDocAuth, docAuthHashMap);
			
			List<Doc> subDocList = getAccessableSubDocList(repos, tempDoc, docAuth, docAuthHashMap, rt);
			if(subDocList == null || subDocList.size() == 0)
			{
				Log.docSysDebugLog("getDocListFromRootToDoc() Failed to get the subDocList under doc: " + pPath+name, rt);
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
		System.out.println("getRelativePath() relativePath:" + relativePath);
		return relativePath;
	}

	protected void addDocToSyncUpList(List<CommonAction> actionList, Repos repos, Doc doc, Action syncType, User user, String commitMsg) 
	{
		Log.printObject("addDocToSyncUpList() syncType:" + syncType + " doc:", doc);
		if(user == null)
		{
			user = autoSyncUser;
		}
		
		if(false == checkDocLocked(doc, DocLock.LOCK_TYPE_FORCE, user, false))
		{
			CommonAction.insertCommonAction(actionList,repos,doc, null, commitMsg, user.getName(), ActionType.AUTOSYNCUP, syncType, DocType.REALDOC, null, user, false);
		}
	}
	
	protected List<Repos> getAccessableReposList(Integer userId) {
		System.out.println("getAccessableReposList() userId:" + userId);
		
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
			System.out.println("仓库名不能为空！");
			rt.setError("仓库名不能为空！");			
			return false;
		}

		if(true == isReposPathBeUsed(repos,rt))
		{
			System.out.println("仓库存储目录 " + repos.getPath() + " 已被使用！");
			rt.setError("仓库存储目录 " + repos.getPath() + " 已被使用！");		
			return false;
		}
		
		//文件系统前置，必须有realDocPath
		if(repos.getType() == 2)
		{
			if(repos.getRealDocPath() == null || repos.getRealDocPath().isEmpty())
			{
				rt.setError("文件存储目录不能为空！");						
				return false;
			}
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
					System.out.println("版本仓库链接不能为空");	//这个其实还不是特别严重，只要重新设置一次即可
					rt.setError("版本仓库链接不能为空！");
					return false;
				}
				
				if(oldSvnPath == null || !svnPath.equals(oldSvnPath))
				{
					//检查版本仓库地址是否已使用
					if(isVerReposPathBeUsed(repos.getId(),svnPath) == true)
					{
						System.out.println("版本仓库地址已使用:" + svnPath);	//这个其实还不是特别严重，只要重新设置一次即可
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
		else
		{
			//文件系统前置，必须有realDocPath
			if(newReposInfo.getType() == 2)
			{
				if(realDocPath != null && realDocPath.isEmpty())
				{
					rt.setError("文件存储目录不能为空！");						
					return false;
				}
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
					System.out.println("版本仓库创建失败");	//这个其实还不是特别严重，只要重新设置一次即可
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
						System.out.println("删除版本仓库失败");
						rt.setError("删除版本仓库失败");	
						return false;						
					}
						
					//Clone the Repository
					if(cloneGitRepos(repos, isRealDoc, rt) == null)
					{
						System.out.println("版本仓库Clone失败");	//这个其实还不是特别严重，只要重新设置一次即可
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
		System.out.println("addRepos() addReposAuth return:" + ret);
		if(ret == 0)
		{
			Log.docSysDebugLog("addRepos() addReposAuth return:" + ret, rt);
			System.out.println("新增用户仓库权限失败");
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

		ret = reposService.addDocAuth(docAuth);
		System.out.println("addRepos() addDocAuth return:" + ret);
		if(ret == 0)
		{
			Log.docSysDebugLog("addRepos() addReposAuth return:" + ret, rt);
			System.out.println("新增用户仓库根目录权限失败");
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
						Log.docSysErrorLog(path + " 已被 " + repos.getName() + "  使用", rt); 
						Log.docSysDebugLog("newReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " reposPath=" + reposPath, rt); 
						return true;
					}
				}
				
				String realDocPath = repos.getRealDocPath();
				if(realDocPath != null && !realDocPath.isEmpty())
				{
					realDocPath = Path.localDirPathFormat(realDocPath, OSType);
					if(path.indexOf(realDocPath) == 0)	//不能把仓库放到其他仓库的文件存储目录
					{					
						Log.docSysErrorLog(path + " 已被 " + repos.getName() + "  使用", rt); 
						Log.docSysDebugLog("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " realDocPath=" + realDocPath, rt); 
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
					Log.docSysErrorLog("文件存储目录：" + newRealDocPath + "已被  " + repos.getName() + " 使用", rt); 
					Log.docSysDebugLog("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " reposPath=" + reposPath,rt); 
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
//						Log.docSysErrorLog("文件存储目录：" + newRealDocPath + "已被  " + repos.getName() + " 使用", rt); 
//						Log.docSysDebugLog("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " realDocPath=" + realDocPath, rt); 
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
//					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
//					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath=" + verReposURI); 
//					return true;
//				}
//			}
//			
//			String verReposURI1 = repos.getSvnPath1();
//			if(verReposURI1 != null && !verReposURI1.isEmpty())
//			{
//				if(isPathConflict(verReposURI1,newVerReposPath))
//				{					
//					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
//					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath1=" + verReposURI1); 
//					return true;
//				}
//			}
			
			//检查是否与本地仓库使用了相同的URI
			String localVerReposURI = Path.getLocalVerReposPath(repos,true);
			if(localVerReposURI != null && !localVerReposURI.isEmpty())
			{
				if(isPathConflict(localVerReposURI,newVerReposPath))
				{					
					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " localVerReposPath=" + localVerReposURI); 
					return true;
				}
			}
			
			String localVerReposURI1 = Path.getLocalVerReposPath(repos,false);
			if(localVerReposURI1 != null && !localVerReposURI1.isEmpty())
			{
				if(isPathConflict(localVerReposURI1,newVerReposPath))
				{					
					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " localVerReposURI1=" + localVerReposURI1); 
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
			System.out.println("addRepos() path:" + path + " not exists, do create it!");
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
		System.out.println("createLocalVerRepos isRealDoc:"+isRealDoc);	
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
		System.out.println("createGitLocalRepos isRealDoc:"+isRealDoc);	

		String localVerRepos = Path.getLocalVerReposPath(repos, isRealDoc);
		File dir = new File(localVerRepos);
		if(dir.exists())
		{
			Log.docSysDebugLog("GIT仓库:"+localVerRepos + "已存在，已直接设置！", rt);
			return localVerRepos;
		}
		
		GITUtil gitUtil = new GITUtil();
		gitUtil.Init(repos, isRealDoc, "");
		String gitPath = gitUtil.CreateRepos();
		return gitPath;
	}

	protected String createSvnLocalRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		System.out.println("createSvnLocalRepos isRealDoc:"+isRealDoc);	
		
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
			Log.docSysDebugLog("SVN仓库:"+localPath+reposName + "已存在，已直接设置！", rt);
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
			System.out.println("ChangeReposRealDocPath oldPath:" + oldPath + " newPath:" + path);
			
			if(login_user.getType() != 2)
			{
				System.out.println("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				return false;							
			}
			
			//如果目标目录已存在则不复制
			File newDir = new File(path);
			if(!newDir.exists())
			{
				if(FileUtil.copyFileOrDir(oldPath, path,true) == false)
				{
					System.out.println("文件目录迁移失败！");
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
			System.out.println("ChangeReposPath oldPath:" + oldPath + " newPath:" + path);
			
			if(login_user.getType() != 2)
			{
				System.out.println("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				return false;							
			}
			
			//newReposRootDir	
			File newReposRootDir = new File(path);
			if(newReposRootDir.exists() == false)
			{
				System.out.println("ChangeReposPath() path:" + path + " not exists, do create it!");
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
				if(previousReposInfo.getType() == 2)
				{
					reposName = "";
				}
				else
				{
					if(path.indexOf(oldPath) == 0)
					{
						System.out.println("禁止将仓库目录迁移到仓库的子目录中！");
						rt.setError("修改仓库位置失败：禁止迁移到本仓库的子目录");	
						return false;
					}
				}
	
				if(FileUtil.copyFileOrDir(oldPath+reposName, path+reposName,true) == false)
				{
					System.out.println("仓库目录迁移失败！");
					rt.setError("修改仓库位置失败！");					
					return false;
				}
				else
				{
					FileUtil.delFileOrDir(oldPath+reposName);
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
	
	protected int getLocalEntryType(String localParentPath, String entryName) {
		
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
	
	protected Doc buildDownloadDocInfo(Integer vid, String path, String name, String targetPath, String targetName)
	{
		System.out.println("buildDownloadDocInfo() targetPath:" + targetPath + " targetName:"  + targetName);
		
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
		if(vid != null)
		{
			doc.setVid(vid);
		}
		return doc;
	}
	
	protected void sendTargetToWebPage(String localParentPath, String targetName, String tmpDir, ReturnAjax rt,HttpServletResponse response, HttpServletRequest request, boolean deleteEnable, String disposition) throws Exception 
	{
		File localEntry = new File(localParentPath,targetName);
		if(false == localEntry.exists())
		{
			Log.docSysErrorLog("文件 " + localParentPath + targetName + " 不存在！", rt);
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
				Log.docSysErrorLog("压缩目录失败：" + localParentPath + targetName, rt);
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
		default:
			sendFileToWebPage(localParentPath, file_name, file_name, rt, response, request, disposition);			
		}
	}
	
	protected void sendFileToWebPage(String localParentPath, String fileName, String showName, ReturnAjax rt,HttpServletResponse response,HttpServletRequest request, String disposition) throws Exception{
		
		String dstPath = localParentPath + fileName;

		//检查文件是否存在
		File file = new File(dstPath);
		if(!file.exists())
		{	
			Log.docSysErrorLog("文件  "+ dstPath + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		System.out.println("sendFileToWebPage() showName befor convert:" + showName);
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
			e.printStackTrace();
			System.out.println("sendFileToWebPage() Exception");
		}
	}
	
    //获取UserAgent接口，即判断目前用户使用了哪种浏览器
	private String getFileNameForWeb(HttpServletRequest request, String showName) throws UnsupportedEncodingException {
		// TODO Auto-generated method stub
		
		//解决中文编码问题
		String userAgent = getUA(request);
		switch(userAgent)
		{
		case "ie":
		case "safari":
			showName = URLEncoder.encode(showName, "UTF-8");  
			System.out.println("sendFileToWebPage() showName after URL Encode:" + showName);
			break;
		default:
			showName = new String(showName.getBytes("UTF-8"),"ISO8859-1");  
			System.out.println("sendFileToWebPage() showName after convert to ISO8859-1:" + showName);
			break;
		}

		//解决空格问题（空格变加号和兼容性问题）
		//showName = showName.replaceAll("\\+", "%20").replaceAll("%28", "\\(").replaceAll("%29", "\\)").replaceAll("%3B", ";").replaceAll("%40", "@").replaceAll("%23", "\\#").replaceAll("%26", "\\&");
		showName = showName.replaceAll("%28", "\\(").replaceAll("%29", "\\)").replaceAll("%3B", ";").replaceAll("%40", "@").replaceAll("%23", "\\#").replaceAll("%26", "\\&");
		System.out.println("sendFileToWebPage() showName:" + showName);
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
					String contentRange = range.replace("=", " ") + "/" + new Long(fileLength).toString();
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
			e.printStackTrace();
		}
	}

	protected boolean doCompressDir(String srcParentPath, String dirName, String dstParentPath, String zipFileName,ReturnAjax rt) {
		
		//if dstDir not exists create it
		File dstDir = new File(dstParentPath);
		if(!dstDir.exists())
		{
			if(FileUtil.createDir(dstParentPath) == false)
			{
				Log.docSysDebugLog("doCompressDir() Failed to create:" + dstParentPath, rt);
				return false;
			}
		}
		//开始压缩
		if(FileUtil.compressExe(srcParentPath + dirName,dstParentPath + zipFileName) == true)
		{
			System.out.println("压缩完成！");	
		}
		else
		{
			System.out.println("doCompressDir()  压缩失败！");
			Log.docSysDebugLog("压缩  " + srcParentPath + dirName + "to" + dstParentPath + zipFileName  +" 失败", rt);
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
			if(c1!=null&&c2!=null&&c1.getValue()!=null&&c2.getValue()!=null&&!"".equals(c1.getValue())&&!"".equals(c2.getValue()))
			{
				System.out.println("自动登录");
				String userName = c1.getValue();
				String pwd = c2.getValue();

				User loginUser = loginCheck(userName, pwd, request, session, response, rt);
				if(loginUser == null)
				{
					System.out.println("自动登录失败");
					rt.setMsgData("自动登陆失败");
					writeJson(rt, response);
					return null;
				}
				
				System.out.println("自动登录成功");
				//Set session
				session.setAttribute("login_user", loginUser);
				//延长cookie的有效期
				addCookie(response, "dsuser", userName, 7*24*60*60);//一周内免登录
				addCookie(response, "dstoken", pwd, 7*24*60*60);
				System.out.println("用户cookie保存成功");
				System.out.println("SESSION ID:" + session.getId());

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
	
	
	protected User loginCheck(String userName, String pwd, HttpServletRequest request, HttpSession session, HttpServletResponse response, ReturnAjax rt) {
		User tmp_user = new User();
		tmp_user.setName(userName);
		String decodedPwd = Base64Util.base64Decode(pwd);
		Log.println("loginCheck decodedPwd:" + decodedPwd);
		String md5Pwd = MD5.md5(decodedPwd);
		tmp_user.setPwd(pwd);
		
		if(systemLdapConfig.enabled == false || systemLdapConfig.url == null || systemLdapConfig.url.isEmpty())
		{
			List<User> uLists = getUserList(userName,md5Pwd);
			boolean ret = loginCheck(rt, tmp_user, uLists, session,response);
			if(ret == false)
			{
				System.out.println("loginCheck() 登录失败");
				return null;
			}
			return uLists.get(0);
		}
		
		//LDAP模式
		Log.println("loginCheck() LDAP Mode"); 
		User ldapLoginUser = ldapLoginCheck(userName, decodedPwd);
		if(ldapLoginUser == null) //LDAP 登录失败（尝试用数据库方式登录）
		{
			List<User> uLists = getUserList(userName,md5Pwd);
			boolean ret = loginCheck(rt, tmp_user, uLists, session,response);
			if(ret == false)
			{
				System.out.println("loginCheck() 登录失败");
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
				return null;			
			}
			
			//For User added by LDAP login no need to check tel and email
			if(userCheck(ldapLoginUser, false, false, rt) == false)
			{
				System.out.println("用户检查失败!");			
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
				Log.docSysErrorLog("Failed to add new User in DB", rt);
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
		LdapContext ctx = getLDAPConnection(userName, pwd);
		if(ctx == null)
		{
			Log.println("ldapLoginCheck() getLDAPConnection 失败"); 
			return null;
		}
		
		List<User> list = readLdap(ctx, "", userName);
		Log.printObject("ldapLoginCheck", list);
		if(list == null || list.size() != 1)
		{
			Log.println("ldapLoginCheck() readLdap 失败"); 			
			return null;
		}
		
		return list.get(0);
	}
	
	/**
     * 获取默认LDAP连接     * Exception 则登录失败，ctx不为空则登录成功
     * @return void
     */
    public LdapContext getLDAPConnection(String userName, String pwd) 
    {
        LdapContext ctx = null;
    	try {
            //String LDAP_URL = "ldap://ed-p-gl.emea.nsn-net.net:389/";
    		//String basedn = "o=NSN";
    		if(systemLdapConfig.enabled == null || systemLdapConfig.enabled == false)
    		{
    			return null;
    		}
    				
    		String LDAP_URL = systemLdapConfig.url;
    		if(LDAP_URL == null || LDAP_URL.isEmpty())
    		{
    			Log.println("getLDAPConnection LDAP_URL is null or empty, LDAP_URL" + LDAP_URL);
    			return null;
    		}
    			
    		String basedn = systemLdapConfig.basedn;
            
            Hashtable<String,String> HashEnv = new Hashtable<String,String>();
            HashEnv.put(Context.SECURITY_AUTHENTICATION, "simple"); // LDAP访问安全级别(none,simple,strong)
            
            //userName为空则只获取LDAP basedn的ctx，不进行用户校验
            if(userName == null || userName.isEmpty())
    		{
    			HashEnv.put(Context.SECURITY_PRINCIPAL, basedn);
    		}
            else
            {
            	String userAccount = "uid=" + userName + "," + basedn;     
    			HashEnv.put(Context.SECURITY_PRINCIPAL, userAccount);
            	Log.println("getLDAPConnection() authMode:" + systemLdapConfig.authMode); 
    			if(systemLdapConfig.authMode != null)
    			{
    				switch(systemLdapConfig.authMode)
    				{
    				case 1:	//Plain Text 验证
        				HashEnv.put(Context.SECURITY_CREDENTIALS, pwd);
        				break;
    				case 2:	//MD5 加密后验证
    					HashEnv.put(Context.SECURITY_CREDENTIALS, MD5.md5(pwd));
        				break;
    				}
    			}
    		}	
            
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            HashEnv.put(Context.PROVIDER_URL, LDAP_URL);
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (CommunicationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    	
        return ctx;
    }
    
    public List<User> readLdap(LdapContext ctx, String basedn, String userId){
		
		List<User> lm=new ArrayList<User>();
		try {
			 if(ctx!=null){
				//过滤条件
	            //String filter = "(&(objectClass=*)(uid=*))";
	            String filter = "(&(objectClass=*)(uid=" +userId+ "))";
				
	            String[] attrPersonArray = { "uid", "userPassword", "displayName", "cn", "sn", "mail", "description" };
	            SearchControls searchControls = new SearchControls();//搜索控件
	            searchControls.setSearchScope(2);//搜索范围
	            searchControls.setReturningAttributes(attrPersonArray);
	            //1.要搜索的上下文或对象的名称；2.过滤条件，可为null，默认搜索所有信息；3.搜索控件，可为null，使用默认的搜索控件
	            NamingEnumeration<SearchResult> answer = ctx.search(basedn, filter.toString(),searchControls);
	            while (answer.hasMore()) {
	                SearchResult result = (SearchResult) answer.next();
	                NamingEnumeration<? extends Attribute> attrs = result.getAttributes().getAll();
	                
	                User lu=new User();
	                while (attrs.hasMore()) {
	                    Attribute attr = (Attribute) attrs.next();
	                    if("userPassword".equals(attr.getID())){
	                    	Object value = attr.get();
	                    	lu.setPwd(new String((byte [])value));
	                    }else if("uid".equals(attr.getID())){
	                    	lu.setName(attr.get().toString());
	                    }else if("displayName".equals(attr.getID())){
	                    	Log.println("readLdap displayName:" + attr.get().toString());
	                    	//lu.setRealName(attr.get().toString());
	                    }
	                    else if("cn".equals(attr.getID())){
	                    //	lu.cn = attr.get().toString();
	                    	Log.println("readLdap cn:" + attr.get().toString());
	                    	lu.setRealName(attr.get().toString());
	                    }
	                	else if("sn".equals(attr.getID())){
	                    //	lu.sn = attr.get().toString();
	                		Log.println("readLdap sn:" + attr.get().toString());
	                    }
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
			 }
		}catch (Exception e) {
			System.out.println("获取用户信息异常:");
			e.printStackTrace();
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
			System.out.println("loginCheck() uLists is null");
			rt.setError("用户名或密码错误！");
			return false;	
		}
		else if(uLists.size()<1){
			System.out.println("loginCheck() uLists size < 1");
			rt.setError("用户名或密码错误！");
			return false;
		}
		
		System.out.println("loginCheck() uLists size:" + uLists.size());
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
			System.out.println("loginCheck() 系统存在多个相同用户 systemUserCount:" + systemUserCount);
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
		
		System.out.println("userName:"+userName + " pwd:"+pwd + " type:" + type + " tel:" + user.getTel() + " email:" + user.getEmail());
		
		//检查用户名是否为空
		if(userName ==null||"".equals(userName))
		{
			Log.docSysErrorLog("用户名不能为空！", rt);
			return false;
		}
		
		//用户是否已存在
		if(isUserNameUsed(userName) == true)
		{
			Log.docSysErrorLog("该用户已存在！", rt);
			return false;
		}
		
		if(telCheckEn)
		{
			//如果用户使用手机号则需要检查手机号
			if(RegularUtil.IsMobliePhone(userName) == true)
			{
				if(isTelUsed(userName) == true)
				{
					Log.docSysErrorLog("该手机已被使用！", rt);
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
					Log.docSysErrorLog("该邮箱已被使用！", rt);
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
					Log.docSysErrorLog("手机格式错误！", rt);
					return false;
				}
				
				if(isTelUsed(tel) == true)
				{
					Log.docSysErrorLog("该手机已被使用！", rt);
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
					Log.docSysErrorLog("邮箱格式错误！", rt);
					return false;
				}
				
				if(isEmailUsed(email) == true)
				{
					Log.docSysErrorLog("该邮箱已被使用！", rt);
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
		
		System.out.println("userName:"+userName + " pwd:"+pwd + " type:" + type + " tel:" + user.getTel() + " email:" + user.getEmail());
		
		//检查用户名是否改动
		if(userName != null && !userName.isEmpty())
		{
			if(isUserNameUsed(userName) == true)
			{
				Log.docSysErrorLog("该用户已存在！", rt);
				return false;
			}
			
			//如果用户使用手机号则需要检查手机号
			if(RegularUtil.IsMobliePhone(userName) == true)
			{
				if(isTelUsed(userName) == true)
				{
					Log.docSysErrorLog("该手机已被使用！", rt);
					return false;				
				}
			}
			
			//如果用户使用邮箱则需要检查邮箱
			if(RegularUtil.isEmail(userName) == true)
			{
				if(isEmailUsed(userName) == true)
				{
					Log.docSysErrorLog("该邮箱已被使用！", rt);
					return false;				
				}
			}			
		}
		
		if(tel != null && !tel.isEmpty())
		{
			if(RegularUtil.IsMobliePhone(tel) == false)
			{
				Log.docSysErrorLog("手机格式错误！", rt);
				return false;
			}
			
			if(isTelUsed(tel) == true)
			{
				Log.docSysErrorLog("该手机已被使用！", rt);
				return false;				
			}
			user.setTelValid(1);
		}
		
		if(email != null && !email.isEmpty())
		{
			if(RegularUtil.isEmail(email) == false)
			{
				Log.docSysErrorLog("邮箱格式错误！", rt);
				return false;
			}
			
			if(isEmailUsed(email) == true)
			{
				Log.docSysErrorLog("该邮箱已被使用！", rt);
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
				Log.docSysErrorLog("邮箱验证失败", rt);
				return false;			
			}
		}
		
		String tel = user.getTel();
		if(tel != null && !tel.isEmpty())
		{
			if(verifyTelephone(tel) == false)
			{
				Log.docSysErrorLog("手机验证失败", rt);
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
		List<Doc> successDocList = verReposCheckOut(repos, false, doc, localParentPath, doc.getName(), commitId, true, true, downloadList);
		if(successDocList == null || successDocList.size() == 0)
		{
			Log.docSysErrorLog("未找到需要恢复的文件！",rt);
			return null;
		}
		
		Log.printObject("revertDocHistory checkOut successDocList:", successDocList);
		
		//Do commit to verRepos		
		String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser, rt, true, null, 2, null);
		if(revision == null)
		{			
			Log.docSysDebugLog("revertDocHistory()  verReposAutoCommit 失败", rt);
			return null;
		}
		//推送至远程仓库
		verReposPullPush(repos, doc.getIsRealDoc(), rt);
		
		if(doc.getIsRealDoc())
		{
			//Force update docInfo
			//Log.printObject("revertDocHistory() successDocList:", successDocList);
			for(int i=0; i< successDocList.size(); i++)
			{
				Doc successDoc = successDocList.get(i);
				System.out.println("revertDocHistory() " + successDoc.getDocId() + " [" + doc.getPath() + doc.getName() + "] 恢复成功");
					
				successDoc.setRevision(revision);
				successDoc.setCreator(login_user.getId());
				successDoc.setLatestEditor(login_user.getId());
				dbUpdateDoc(repos, successDoc, true);
				dbCheckAddUpdateParentDoc(repos, successDoc, null, null);
			}
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
		System.out.println("addDoc() docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
	
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return addDoc_FSM(repos, doc,	//Add a empty file
					uploadFile, //For upload
					chunkNum, chunkSize, chunkParentPath, //For chunked upload combination
					commitMsg, commitUser, login_user, rt, actionList);
			
		}
		return false;
	}
	
	//底层addDoc接口
	//docData: null为新建文件或者是目录，否则为文件上传（新增）
	protected boolean addDocEx(Repos repos, Doc doc, 
			byte[] docData,
			Integer chunkNum, Long chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		System.out.println("addDoc() docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
	
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return addDocEx_FSM(repos, doc,	//Add a empty file
					docData, //For upload
					chunkNum, chunkSize, chunkParentPath, //For chunked upload combination
					commitMsg, commitUser, login_user, rt, actionList);
			
		}
		return false;
	}

	protected boolean addDoc_FSM(Repos repos, Doc doc,	//Add a empty file
			MultipartFile uploadFile, //For upload
			Integer chunkNum, Long chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		System.out.println("addDoc_FSM()  docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName() + " type:" + doc.getType());
		
		//add doc detail info
		doc.setCreator(login_user.getId());
		doc.setCreatorName(login_user.getName());
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, lockType,  2*60*60*1000, login_user, rt, false);
			if(docLock == null)
			{
				SyncLock.unlock(syncLock);
				System.out.println("addDoc_FSM() lockDoc " + doc.getName() + " Failed!");
				return false;
			}
		}
		
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();
		String localDocPath = localParentPath + doc.getName();
		File localEntry = new File(localDocPath);
		if(localEntry.exists())
		{	
			unlockDoc(doc, lockType, login_user);
			Log.docSysDebugLog("addDoc_FSM() " +localDocPath + "　已存在！", rt);
		}
		
		//addDoc接口用uploadFile是否为空来区分新建文件还是上传文件
		if(uploadFile == null)
		{	
			//File must not exists
			if(createRealDoc(repos, doc, rt) == false)
			{	
				unlockDoc(doc, lockType, login_user);
				String MsgInfo = "createRealDoc " + doc.getName() +" Failed";
				rt.setError(MsgInfo);
				System.out.println("addDoc_FSM() createRealDoc Failed");
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
				System.out.println("addDoc_FSM() updateRealDoc Failed");
				return false;
			}
		}
		
		//Update the latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setCreateTime(fsDoc.getLatestEditTime());
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
		
		String revision = verReposDocCommit(repos, false, doc,commitMsg,commitUser,rt, false, null, 2, null);
		if(revision == null)
		{
			Log.docSysWarningLog("verReposDocCommit Failed", rt);
		}
		else
		{
			//only do dbAddDoc when commit success, otherwise the added doc will not be commit when do syncup (because dbDoc is same to localDoc) 
			doc.setRevision(revision);
			if(dbAddDoc(repos, doc, false, false) == false)
			{	
				Log.docSysWarningLog("Add Node: " + doc.getName() +" Failed！", rt);
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
				
		//BuildMultiActionListForDocAdd();
		BuildMultiActionListForDocAdd(actionList, repos, doc, commitMsg, commitUser);
		
		unlockDoc(doc, lockType, login_user);
		
		rt.setData(doc);
		rt.setMsgData("isNewNode");
		Log.docSysDebugLog("新增成功", rt); 
		
		return true;
	}
	
	protected boolean addDocEx_FSM(Repos repos, Doc doc,	//Add a empty file
			byte[] docData,
			Integer chunkNum, Long chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		System.out.println("addDoc_FSM()  docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName() + " type:" + doc.getType());
		
		//add doc detail info
		doc.setCreator(login_user.getId());
		doc.setCreatorName(login_user.getName());
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, lockType,  2*60*60*1000, login_user, rt, false);
			if(docLock == null)
			{
				SyncLock.unlock(syncLock);
				System.out.println("addDoc_FSM() lockDoc " + doc.getName() + " Failed!");
				return false;
			}
		}
		
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();
		String localDocPath = localParentPath + doc.getName();
		File localEntry = new File(localDocPath);
		if(localEntry.exists())
		{	
			unlockDoc(doc, lockType, login_user);
			Log.docSysDebugLog("addDoc_FSM() " +localDocPath + "　已存在！", rt);
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
				System.out.println("addDoc_FSM() createRealDoc Failed");
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
				System.out.println("addDoc_FSM() updateRealDoc Failed");
				return false;
			}
		}
		
		//Update the latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setCreateTime(fsDoc.getLatestEditTime());
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
		
		String revision = verReposDocCommit(repos, false, doc,commitMsg,commitUser,rt, false, null, 2, null);
		if(revision == null)
		{
			Log.docSysWarningLog("verReposDocCommit Failed", rt);
		}
		else
		{
			//only do dbAddDoc when commit success, otherwise the added doc will not be commit when do syncup (because dbDoc is same to localDoc) 
			doc.setRevision(revision);
			if(dbAddDoc(repos, doc, false, false) == false)
			{	
				Log.docSysWarningLog("Add Node: " + doc.getName() +" Failed！", rt);
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
				
		//BuildMultiActionListForDocAdd();
		BuildMultiActionListForDocAdd(actionList, repos, doc, commitMsg, commitUser);
		
		unlockDoc(doc, lockType, login_user);
		
		rt.setData(doc);
		rt.setMsgData("isNewNode");
		Log.docSysDebugLog("新增成功", rt); 
		
		return true;
	}

	
	private boolean dbUpdateDocRevision(Repos repos, Doc doc, String revision) {
		System.out.println("dbUpdateDocRevision " + revision + " doc " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "]");

		Doc dbDoc = dbGetDoc(repos, doc, false);
		if(dbDoc == null)
		{
			System.out.println("dbUpdateDocRevision dbDoc " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "] 不存在");
			doc.setRevision(revision);
			return dbAddDoc(repos,doc, false, false);
		}
		
		if(dbDoc.getRevision() == null || !dbDoc.getRevision().equals(revision))
		{
			dbDoc.setRevision(revision);
			if(dbUpdateDoc(repos, dbDoc, false) == false)
			{
				System.out.println("dbUpdateDocRevision 更新节点版本号失败: " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "]");	
				return false;
			}
			return true;
		}
		
		return true;
	}
	
	//该接口用于更新父节点的信息: 仓库有commit成功的操作时必须调用
	private void dbCheckAddUpdateParentDoc(Repos repos, Doc doc, List<Doc> parentDocList, List<CommonAction> actionList) 
	{
		if(repos.getType() != 1)
		{
			//For Non FSM type repos, dbNode is not need
			return;
		}
		
		System.out.println("checkAddUpdateParentDoc " + doc.getDocId() + " " +doc.getPath() + doc.getName());
		
		if(doc.getDocId() == 0)
		{
			return;
		}
		
		System.out.println("checkAddUpdateParentDoc pid:" + doc.getPid());
		
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
				System.out.println("checkAddUpdateParentDoc 新增目录: " + parentDoc.getDocId() + " " + parentDoc.getPath() + parentDoc.getName());
				
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
					System.out.println("checkAddUpdateParentDoc 更新父节点版本号失败: " + parentDoc.getDocId() + " " + parentDoc.getPath() + parentDoc.getName());	
				}
			}
		}
	}

	//底层deleteDoc接口
	protected String deleteDoc(Repos repos, Doc doc, String commitMsg,String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return deleteDoc_FSM(repos, doc, commitMsg, commitUser, login_user,  rt, actionList);			
		}
		return null;
	}

	protected String deleteDoc_FSM(Repos repos, Doc doc,	String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		Long docId = doc.getDocId();
		if(docId == 0)
		{
			//由于前台是根据docId和pid来组织目录结构的，所以前台可以删除docId=0的节点，表示数据库中存在一个docId=0的非法节点，直接删除掉
			Log.docSysDebugLog("deleteDoc_FSM() 这是一个非法节点docId = 0", rt);
			dbDeleteDoc(repos, doc, false);
			return null;
		}
		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		synchronized(syncLock)
		{							
			//Try to lock the Doc
			docLock = lockDoc(doc, lockType, 2*60*60*1000,login_user,rt,true);	//lock 2 Hours 2*60*60*1000
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); 
				Log.docSysDebugLog("deleteDoc_FSM() Failed to lock Doc: " + docId, rt);
				return null;			
			}
			SyncLock.unlock(syncLock); 
		}
		System.out.println("deleteDoc_FSM() " + docId + " " + doc.getName() + " Lock OK");
		

		//Build ActionList for RDocIndex/VDoc/VDocIndex/VDocVerRepos delete
		BuildMultiActionListForDocDelete(actionList, repos, doc, commitMsg, commitUser,true);
		
		//get RealDoc Full ParentPath
		if(deleteRealDoc(repos,doc,rt) == false)
		{
			unlockDoc(doc, lockType, login_user);
			
			Log.docSysDebugLog("deleteDoc_FSM() deleteRealDoc Failed", rt);
			Log.docSysErrorLog(doc.getName() + " 删除失败！", rt);
			return null;
		}
		

		String revision = verReposDocCommit(repos, false, doc, commitMsg,commitUser,rt, true, null, 2, null);
		if(revision == null)
		{
			Log.docSysDebugLog("deleteDoc_FSM() verReposRealDocDelete Failed", rt);
			Log.docSysWarningLog("verReposRealDocDelete Failed", rt);
		}
		else
		{
			//Delete DataBase Record and Build AsynActions For delete 
			if(dbDeleteDocEx(actionList, repos, doc, commitMsg, commitUser, true) == false)
			{	
				Log.docSysWarningLog("不可恢复系统错误：dbDeleteDoc Failed", rt);
			}
			
			//delete操作需要自动增加ParentDoc???
			//dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
			
			//Insert Push Action
			CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
		}
		
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
		
		String content = doc.getContent();
		if(content == null || content.isEmpty())
		{
			return;
		}
		//Insert add action for VDoc

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
		if(deleteSubDocs == true)
		{
			List<Doc> subDocList = docSysGetDocList(repos, doc);
			if(subDocList != null)
			{
				for(int i=0; i<subDocList.size(); i++)
				{
					Doc subDoc = subDocList.get(i);
					BuildMultiActionListForDocDelete(actionList, repos, subDoc, commitMsg, commitUser, deleteSubDocs);
				}
			}
		}	

		//Insert index delete action for RDoc Name
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.DELETE, DocType.DOCNAME, null, null, false);
		//Insert index delete action for RDoc
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.DELETE, DocType.REALDOC, null, null, false);

		//Insert delete action for VDoc
		//CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.FS, Action.DELETE, DocType.VIRTURALDOC, null);
		//Insert delete action for VDoc verRepos 
		//CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.DELETE, DocType.VIRTURALDOC,, null);
		//Insert delete action for VDoc Index
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX,  Action.DELETE, DocType.VIRTURALDOC, null, null, false);
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
			System.out.println("BuildMultiActionListForDocCopy() dstDoc.name is empty:" + dstDoc.getDocId() + " path:" + dstDoc.getPath() + " name:" +dstDoc.getName());
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
			//ActionId 1:FS 2:VerRepos 3:DB 4:Index  5:AutoSyncUp
			//ActionType 1:add 2:delete 3:update 4:move 5:copy
		    //DocType 0:DocName 1:RealDoc 2:VirtualDoc   AutoSyncUp(1: localDocChanged  2: remoteDocChanged)
			
			//Insert IndexAction For RealDoc Name Copy or Move (对于目录则会进行递归)
			if(isMove)
			{
				CommonAction.insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.INDEX, com.DocSystem.common.CommonAction.Action.UPDATE, com.DocSystem.common.CommonAction.DocType.DOCNAME, null, null, true);
			}
			else	//对于copy操作则新增对该docName的索引
			{
				CommonAction.insertCommonAction(actionList, repos, dstDoc, null, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.INDEX, com.DocSystem.common.CommonAction.Action.ADD, com.DocSystem.common.CommonAction.DocType.DOCNAME, null, null, true);				
			}
			
			//Insert IndexAction For RealDoc Copy or Move (对于目录则会进行递归)
			CommonAction.insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.INDEX, actionId, com.DocSystem.common.CommonAction.DocType.REALDOC, null, null, true);
			//Copy VDoc (包括VDoc VerRepos and Index)
			CommonAction.insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.FS, com.DocSystem.common.CommonAction.Action.COPY, DocType.VIRTURALDOC, null, null, true);
			CommonAction.insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.VERREPOS, com.DocSystem.common.CommonAction.Action.COPY, DocType.VIRTURALDOC, null, null, true);
			//Copy or Move VDoc (包括VDoc VerRepos and Index)
			CommonAction.insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.INDEX, actionId, DocType.VIRTURALDOC, null, null, true);
		}	
	}
		
	public boolean executeCommonActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		if(actionList == null || actionList.size() == 0)
		{
			return true;
		}
		
		int size = actionList.size();
		System.out.println("executeCommonActionList size:" + size);
		
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
			System.out.println("executeCommonActionList() failed actions:" + (size - count));	
			return false;
		}
		
		return true;
	}
	
	private boolean executeCommonAction(CommonAction action, ReturnAjax rt) {
		
		boolean ret = false;
		
		Doc srcDoc = action.getDoc();
		
		System.out.println("executeCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());

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
			String dstSubDocParentPath = dstDoc.getPath() + dstDoc.getName() +"/";
			String srcSubDocParentPath = srcDoc.getPath() + srcDoc.getName() +"/";
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
	    		System.out.println("executeDocCopyCommonActionForSubDir() BuildMultiActionListForDocCopy subFile:" + name);

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

	protected boolean executeUniqueCommonActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		System.out.println("********** executeUniqueCommonActionList ***********");
		if(actionList.size() <= 0)
		{
			System.out.println("********** executeUniqueCommonActionList actionList is empty ***********");			
			return false;
		}
		
		//Inset ActionList to uniqueCommonAction
		for(int i=0; i<actionList.size(); i++)
		{
			insertUniqueCommonAction(actionList.get(i));
		}
		
		//注意：ActionList中的doc必须都是同一个仓库下的，否则下面的逻辑会有问题
		Integer reposId = actionList.get(0).getDoc().getVid(); //get the reposId from the first doc in action list
		System.out.println("executeUniqueCommonActionList reposId:" + reposId);
		
		UniqueAction uniqueAction = uniqueActionHashMap.get(reposId);
		if(uniqueAction == null)
		{
			System.out.println("executeUniqueCommonActionList uniqueAction for " + reposId+ " is null");
			return false;
		}
		
		if(uniqueAction.getIsRunning())
		{
			System.out.println("executeUniqueCommonActionList uniqueCommonAction for " + reposId+ " is Running");
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
			
			System.out.println("executeUniqueCommonActionList uniqueCommonAction for " + reposId+ " Running timeout, clear uniqueAction");
			
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
			ConcurrentHashMap<Long, CommonAction> hashMap = uniqueAction.getUniqueCommonActionHashMap();
			List<CommonAction> list = uniqueAction.getUniqueCommonActionList();
			while(hashMap.size() > 0)
			{
				if(actionList.size() > 0)
				{
					CommonAction action = list.get(0);
					long docId = action.getDoc().getDocId();
					executeCommonAction(action, rt);
					list.remove(0);
					hashMap.remove(docId);
				}
				else
				{
					System.out.println("executeUniqueCommonActionList() hashMap 和 list不同步，强制清除 actionHashMap");
				}
			}
			//清空uniqueAction
			uniqueAction.setIsRunning(false);
			uniqueAction.setExpireTimeStamp(null);
			uniqueAction.getUniqueCommonActionHashMap().clear();
			uniqueAction.getUniqueCommonActionList().clear();	
			System.out.println("executeUniqueCommonActionList completed for repos: " + reposId);			
			ret = true;
		} catch (Exception e) {
			e.printStackTrace();
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
	
	private boolean executeSyncUpAction(CommonAction action, ReturnAjax rt) {
		Log.printObject("executeSyncUpAction() action:",action);
		return syncupForDocChange(action, rt);
	}

	//这个接口要保证只有一次Commit操作
	private boolean syncupForDocChange(CommonAction action, ReturnAjax rt) {		
		Doc doc = action.getDoc();
		if(doc == null)
		{
			return false;
		}
		System.out.println("syncupForDocChange() **************************** 启动自动同步 ********************************");
		Log.printObject("syncupForDocChange() doc:",doc);
		
		User login_user = action.getUser();
		if(login_user == null)
		{
			login_user = autoSyncUser;
		}
		
		//文件管理系统
		HashMap<Long, DocChange> localChanges = new HashMap<Long, DocChange>();
		HashMap<Long, DocChange> remoteChanges = new HashMap<Long, DocChange>();
		Integer subDocSyncupFlag = 1;
		if(action.getAction() == Action.SYNC || action.getAction() == Action.FORCESYNC)
		{
			subDocSyncupFlag = 2;
		}
		
		Repos repos = action.getRepos();
		repos.isTextSearchEnabled = isReposTextSearchEnabled(repos);
		Log.printObject("syncupForDocChange() repos:", repos);
		
		//文件管理系统类型需要进行RealDoc的同步
		boolean realDocSyncResult = false;
		
		if(repos.getIsRemote() == 1)
		{
			//Sync Up local VerRepos with remote VerRepos
			verReposPullPush(repos, true, null);
		}
		
		if(repos.getType() == 1)	
		{	
			realDocSyncResult = syncUpLocalAndRemote(repos, doc, action, localChanges, remoteChanges, subDocSyncupFlag, login_user, rt);
			System.out.println("syncupForDocChange() ************************ 结束自动同步 ****************************");
		}
		else
		{
			System.out.println("syncupForDocChange() 前置类型仓库不需要同步:" + repos.getType());
			System.out.println("syncupForDocChange() ************************ 结束自动同步 ****************************");
			realDocSyncResult = true;
		}
		
		checkAndUpdateIndex(repos, doc, action, localChanges, remoteChanges, subDocSyncupFlag, rt);
		return realDocSyncResult;
	}
	
	private boolean syncUpLocalAndRemote(Repos repos, Doc doc, CommonAction action, HashMap<Long, DocChange> localChanges, HashMap<Long, DocChange> remoteChanges, Integer subDocSyncupFlag, User login_user, ReturnAjax rt) {
		if(repos.getType() != 1)
		{
			System.out.println("syncupForDocChange() 前置类型仓库不需要同步:" + repos.getType());
			System.out.println("syncupForDocChange() ************************ 结束自动同步 ****************************");
			return true;
		}
		
		//对本地文件和版本仓库进行同步
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			System.out.println("syncupForDocChange() 本地文件信息获取异常:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			System.out.println("syncupForDocChange() ************************ 结束自动同步 ****************************");
			return false;
		}
		Doc remoteEntry = verReposGetDoc(repos, doc, null);
		if(remoteEntry == null)
		{
			System.out.println("syncupForDocChange() 远程文件信息获取异常:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			System.out.println("syncupForDocChange() ************************ 结束自动同步 ****************************");
			return false;
		}
		
		Doc dbDoc = dbGetDoc(repos, doc, false);
		
		boolean ret = syncupScanForDoc_FSM(repos, doc, dbDoc, localEntry, remoteEntry, login_user, rt, remoteChanges, localChanges, subDocSyncupFlag);

		System.out.println("syncupForDocChange() syncupScanForDoc_FSM ret:" + ret);
		if(remoteChanges.size() == 0)
		{
			System.out.println("syncupForDocChange() 远程没有改动");
		}
		else
		{
			//Do Remote SyncUp
			syncupRemoteChanges_FSM(repos, login_user, remoteChanges, rt);
		}
		
		if(localChanges.size() == 0)
		{
			System.out.println("syncupForDocChange() 本地没有改动");
			return true;
		}
		
		if(action.getAction() == Action.UNDEFINED)
		{
			System.out.println("syncupForDocChange() Action:" + action.getAction() + " 本地有改动不进行同步 ");			
			return true;
		}
		
		return syncupLocalChanges_FSM(repos, doc, action.getCommitMsg(), action.getCommitUser(), login_user, localChanges, subDocSyncupFlag, rt);
	}

	private void checkAndUpdateIndex(Repos repos, Doc doc, CommonAction action, HashMap<Long, DocChange> localChanges, HashMap<Long, DocChange> remoteChanges, Integer subDocSyncupFlag, ReturnAjax rt) {
		//用户手动刷新：总是会触发索引刷新操作
		if(action.getAction() == Action.FORCESYNC || action.getAction() == Action.SYNC)
		{
			System.out.println("**************************** syncupForDocChange() 强制刷新Index for: " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
			if(docDetect(repos, doc))
			{
				doc.isRealDocTextSearchEnabled = isRealDocTextSearchDisabled(repos, doc, true)? 0: 1;
				if(doc.getDocId() == 0)
				{
					//Delete All Index Lib
					deleteDocNameIndexLib(repos);
					deleteRDocIndexLib(repos);
					deleteVDocIndexLib(repos);
					//Build All Index For Doc
					buildIndexForDoc(repos, doc, null, null, rt, 2, true);
				}
				else
				{
					//deleteAllIndexUnderDoc
					deleteAllIndexForDoc(repos, doc, 2);
					//buildAllIndexForDoc
					buildIndexForDoc(repos, doc, null, null, rt, 2, true);
				}
			}
			System.out.println("**************************** syncupForDocChange() 结束强制刷新Index for: " + doc.getDocId()  + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
		}
		else	//页面刷新：只在检测到文件有改动的时候才刷新索引
		{
			if(localChanges.size() > 0 || remoteChanges.size() > 0)
			{
				System.out.println("**************************** syncupForDocChange() 开始刷新Index for: " + doc.getDocId()  + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
				if(docDetect(repos, doc))
				{	
					doc.isRealDocTextSearchEnabled = isRealDocTextSearchDisabled(repos, doc, true)? 0: 1;
					HashMap<Long, Doc> doneList = new HashMap<Long, Doc>();
					rebuildIndexForDoc(repos, doc, remoteChanges, localChanges, doneList, rt, subDocSyncupFlag, false);	
				}
				System.out.println("**************************** syncupForDocChange() 结束刷新Index for: " + doc.getDocId()  + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
			}
		}
	}

	private boolean docDetect(Repos repos, Doc doc) {
		System.out.println("docDetect()");
		List<Doc> entryList =  docSysGetDocList(repos, doc);
		if(entryList != null)
		{
			return true;
		}
		return false;
	}

	private void deleteAllIndexForDoc(Repos repos, Doc doc, int deleteFlag) 
	{
		deleteIndexForDocName(repos, doc, deleteFlag);
		deleteIndexForRDoc(repos, doc, deleteFlag);
		deleteIndexForVDoc(repos, doc, deleteFlag);
	}

	private boolean buildIndexForDoc(Repos repos, Doc doc, HashMap<Long, DocChange> remoteChanges,
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
		
		List<Doc> entryList = docSysGetDocList(repos, doc);		
		if(entryList == null)
    	{
    		System.out.println("buildIndexForDoc() entryList 获取异常:");
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
		//System.out.println("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag + " force:" + force);
		if(isDocInChangeList(doc, remoteChanges) || isDocInChangeList(doc, remoteChanges))
		{
			if(isDocInDoneList(doc, doneList))
			{
				return true;
			}
			
			Doc localDoc = docSysGetDoc(repos, doc);
			Doc indexDoc = indexGetDoc(repos, doc, INDEX_DOC_NAME, false);
			if(localDoc == null || localDoc.getType() == 0) //文件不存在则删除索引
			{
				//文件已被删除
				if(indexDoc == null)
				{
					System.out.println("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件不存在，索引不存在");					
				}
				else
				{
					System.out.println("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件不存在，索引存在，删除索引");
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
					System.out.println("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件存在，索引不存在，添加索引");
					addIndexForDocName(repos, doc);
					addIndexForRDoc(repos, doc);
					addIndexForVDoc(repos, doc);
					subDocSyncupFlag = 2;	//如果index不存在则强制修改索引递归标记
				}
				else if(force || isDocChanged(localDoc, indexDoc))
				{
					System.out.println("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件变更，更新索引");
					deleteAllIndexForDoc(repos, doc, 1);								
					addIndexForDocName(repos, doc);
					addIndexForRDoc(repos, doc);
					addIndexForVDoc(repos, doc);
				}
			}
			addToDoneList(doc, doneList);
			
			if(localDoc.getType() != null && localDoc.getType() == 1)
			{
				//System.out.println("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 是文件！");
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
		
		List<Doc> entryList = docSysGetDocList(repos, doc);
		if(entryList == null)
    	{
    		System.out.println("refreshIndexForDoc() localEntryList 获取异常:");
        	return false;
    	}
    	
    	for(int i=0; i< entryList.size(); i++)
    	{
    		Doc subDoc = entryList.get(i);
    		rebuildIndexForDoc(repos, subDoc, remoteChanges, localChanges, doneList, rt, subDocSyncupFlag, force);
    	}
		return true;
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

	private boolean syncupLocalChanges_FSM(Repos repos, Doc doc, String commitMsg, String commitUser, User login_user, HashMap<Long, DocChange> localChanges, Integer subDocSyncupFlag, ReturnAjax rt) 
	{
		//本地有改动需要提交
		System.out.println("syncupLocalChanges_FSM() 本地有改动: [" + doc.getPath()+doc.getName() + "], do Commit");
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
		synchronized(syncLock)
		{
			//Try to lock the Doc
			docLock = lockDoc(doc, lockType, 1*60*60*1000,login_user,rt,true); //2 Hours 2*60*60*1000 = 86400,000
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); 
				Log.docSysDebugLog("syncupLocalChanges_FSM() Failed to lock Doc: " + doc.getName(), rt);
				System.out.println("syncupLocalChanges_FSM() 文件已被锁定:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
				return false;
			}
			SyncLock.unlock(syncLock); 
		}
		
		List<CommitAction> commitActionList = new ArrayList<CommitAction>();
		String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser, rt, true, localChanges, subDocSyncupFlag, commitActionList);
		if(revision == null)
		{
			System.out.println("syncupLocalChanges_FSM() 本地改动Commit失败:" + revision);
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
		
		System.out.println("syncupLocalChanges_FSM() 本地改动更新完成:" + revision);
		unlockDoc(doc, lockType, login_user);
		
		return true;	
	}

	private boolean syncupForDocChange_NoFS(Repos repos, Doc doc, User login_user, ReturnAjax rt, int subDocSyncFlag) 
	{
		Doc remoteEntry = verReposGetDoc(repos, doc, null);
		if(remoteEntry == null)
		{
			Log.docSysDebugLog("syncupForDocChange_NoFS() remoteEntry is null for " + doc.getPath()+doc.getName() + ", 无法同步！", rt);
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
			synchronized(syncLock)
			{
				//Try to lock the Doc
				docLock = lockDoc(doc, lockType, 1*60*60*1000,login_user,rt,true); //2 Hours 2*60*60*1000 = 86400,000
				if(docLock == null)
				{
					SyncLock.unlock(syncLock); 
					Log.docSysDebugLog("syncupForDocChange() Failed to lock Doc: " + doc.getName(), rt);
					return false;
				}
				SyncLock.unlock(syncLock); 
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
	    
	    List<Doc> remoteEntryList = getRemoteEntryList(repos, doc);
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
        System.out.println("isRemoteDocChanged() latestRevision:" + latestRevision + " doc:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
        System.out.println("isRemoteDocChanged() previoRevision:" + dbDoc.getRevision());
        
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
			System.out.println("syncUpForRemoteChange_NoFS() remote Added: " + doc.getPath()+doc.getName());
			return dbAddDoc(repos, remoteEntry, false, false);
		case REMOTEFILETODIR:
		case REMOTEDIRTOFILE:
			System.out.println("syncUpForRemoteChange_NoFS() remote Type Changed: " + doc.getPath()+doc.getName());
			dbDeleteDoc(repos, doc,true);
			return dbAddDoc(repos, remoteEntry, true, false);
		case REMOTECHANGE:
			System.out.println("syncUpForRemoteChange_NoFS() remote File Changed: " + doc.getPath()+doc.getName());
			doc.setRevision(remoteEntry.getRevision());
			return dbUpdateDoc(repos, doc, true);
		case REMOTEDELETE:
			//Remote Deleted
			System.out.println("syncUpForRemoteChange_NoFS() remote Deleted: " + doc.getPath()+doc.getName());
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
	
	protected boolean syncupScanForDoc_FSM(Repos repos, Doc doc, Doc dbDoc, Doc localEntry, Doc remoteEntry, User login_user, ReturnAjax rt, HashMap<Long, DocChange> remoteChanges, HashMap<Long, DocChange> localChanges, int subDocSyncFlag) 
	{
		//Log.printObject("syncupScanForDoc_FSM() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " ", doc);

		if(doc.getDocId() == 0)	//For root dir, go syncUpSubDocs
		{
			System.out.println("syncupScanForDoc_FSM() 同步根目录");			
			return syncupScanForSubDocs_FSM(repos, doc, login_user, rt, remoteChanges, localChanges, subDocSyncFlag);
		}
		
		if(repos.getVerCtrl() == 2)
		{
			if(doc.getName().equals(".git"))
			{
				System.out.println("syncupScanForDoc_FSM() .git was ignored");		
				return true;
			}
		}
		DocChangeType docChangeType = getDocChangeType_FSM(repos, doc, dbDoc, localEntry, remoteEntry);
		
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
			localChanges.put(doc.getDocId(), localChange);
			//System.out.println("syncupScanForDoc_FSM() docChangeType: " + localChange.getType() + " docId:" + doc.getDocId() + " docPath:" +doc.getPath() + doc.getName());
			return true;
		//由于远程同步需要直接修改或删除本地文件，一旦误操作将无法恢复，必须保证删除修改操作的文件的历史已经在版本仓库中
		case REMOTEDELETE:	//remoteDelete
		case REMOTECHANGE:	//remoteFileChanged
		case REMOTEFILETODIR:	//remoteTypeChanged(From File To Dir)
		case REMOTEDIRTOFILE:	//remoteTypeChanged(From Dir To File)
			if(isDocInVerRepos(repos, doc, dbDoc.getRevision()) == false)
			{
				//System.out.println("syncupForDocChange_FSM() " + doc.getPath()+doc.getName() + " not exists in verRepos at revision:" + dbDoc.getRevision() + " treat it as LOCALCHANGE");
				DocChange localChange1 = new DocChange();
				localChange1.setDoc(doc);
				localChange1.setDbDoc(dbDoc);
				localChange1.setLocalEntry(localEntry);
				localChange1.setRemoteEntry(remoteEntry);
				localChange1.setType(DocChangeType.LOCALCHANGE);	//LOCALCHANGE才能保证在AutoCommit的时候正常工作
				localChanges.put(dbDoc.getDocId(), localChange1);
				//System.out.println("syncupScanForDoc_FSM() docChangeType: " + localChange1.getType() + " docId:" + doc.getDocId() + " docPath:" +doc.getPath() + doc.getName());
				return true;
			}
		case REMOTEADD:	//remoteAdd
			DocChange remoteChange = new DocChange();
			remoteChange.setDoc(doc);
			remoteChange.setDbDoc(dbDoc);
			remoteChange.setLocalEntry(localEntry);
			remoteChange.setRemoteEntry(remoteEntry);
			remoteChange.setType(docChangeType);
			remoteChanges.put(doc.getDocId(), remoteChange);
			//System.out.println("syncupScanForDoc_FSM() docChangeType: " + remoteChange.getType() + " docId:" + doc.getDocId() + " docPath:" +doc.getPath() + doc.getName());
			return true;
		case NOCHANGE:		//no change
			if(dbDoc != null && dbDoc.getType() == 2)
			{
				return syncupScanForSubDocs_FSM(repos, doc, login_user, rt, remoteChanges, localChanges, subDocSyncFlag);
			}
			return true;
		default:
			break;
		}		
		return false;
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
	
	protected DocChangeType getDocChangeType_FSM(Repos repos,Doc doc, Doc dbDoc, Doc localEntry, Doc remoteEntry) 
	{						
		//dbDoc不存在
		if(dbDoc == null)
		{
			//System.out.println("getDocChangeType_FSM() dbDoc 不存在, localEntry存在");
			if(localEntry != null && localEntry.getType() != 0)
			{
				//本地新增文件/目录
				//System.out.println("getDocChangeType_FSM() 本地新增:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc不存在 localEntry存在" );
				return DocChangeType.LOCALADD;
			}
			
			if(remoteEntry != null && remoteEntry.getType() != 0)
			{
				//远程文件/目录新增
				//System.out.println("getDocChangeType_FSM() 远程新增:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc不存在 localEntry不存在 remoteEntry存在");
				return DocChangeType.REMOTEADD;
			}
			
			//未变更
			//System.out.println("getDocChangeType_FSM() 未变更(dbDoc不存在/localDoc不存在/remoteDoc不存在):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return DocChangeType.NOCHANGE;
		}
		
		//dbDoc存在，localEntry不存在
		if(localEntry == null || localEntry.getType() == 0)
		{
			DocChangeType remoteChangeType = getRemoteChangeType(repos, doc, dbDoc, remoteEntry);
			if(remoteChangeType == DocChangeType.NOCHANGE || remoteChangeType == DocChangeType.REMOTEDELETE)
			{
				//本地文件/目录删除
				//System.out.println("getDocChangeType_FSM() 本地删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc存在 localEntry不存在");
				return DocChangeType.LOCALDELETE;
			}
			
			//远程文件/目录 类型变化、内容修改、删除
			//System.out.println("getDocChangeType_FSM() 远程类型变化/内容修改/删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return remoteChangeType;
		}
		
		//dbDoc存在，localEntry存在且是文件
		if(localEntry.getType() == 1)
		{
			if(dbDoc.getType() == 2)
			{
				//本地目录 类型变化 （目录删除后新增同名文件）
				//System.out.println("getDocChangeType_FSM() 本地类型变化（目录->文件）:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + "dbDoc是目录, localEntry是文件");
				return DocChangeType.LOCALDIRTOFILE;
			}
			
			if(isDocLocalChanged(repos, dbDoc, localEntry))
			{
				//本地文件 内容修改
				System.out.println("getDocChangeType_FSM() 本地文件修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc和localEntry是文件");
				return DocChangeType.LOCALCHANGE;
			}
			
			if(remoteEntry == null || remoteEntry.getType() == 0)
			{
				//远程删除
				//System.out.println("getDocChangeType_FSM() 远程删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc和localEntry是文件且一致, remoteEntry不存在");
				return DocChangeType.REMOTEDELETE;
			}
			
			if(remoteEntry.getType() == 2)
			{
				//远程文件 类型变化（文件被删除并增加了同名目录）
				//System.out.println("getDocChangeType_FSM() 远程类型改变（文件->目录）:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc和localEntry是文件且一致, remoteEntry是目录");
				return DocChangeType.REMOTEFILETODIR;
			}
			
			if(remoteEntry.getRevision() == null)
			{
				//本地文件 内容修改
				//System.out.println("getDocChangeType_FSM() 本地文件修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc和localEntry是文件，但远程节点没有版本号");
				return DocChangeType.LOCALCHANGE;				
			}
						
			if(isDocRemoteChanged(repos, dbDoc, remoteEntry))
			{
				//远程文件 内容修改
				System.out.println("getDocChangeType_FSM() 远程文件修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc和localEntry是文件且一致, remoteEntry是文件但不一致");
				return DocChangeType.REMOTECHANGE;
			}
			
			//未变更
			//System.out.println("getDocChangeType_FSM() 未变更(dbDoc存在/localDoc是文件/remoteDoc是文件):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return DocChangeType.NOCHANGE;
		}
		
		//dbDoc存在，localDoc存在且是目录
		if(localEntry.getType() == 2)
		{
			if(dbDoc.getType() == 1)
			{
				//本地文件 类型变化 （文件删除后新增同名文件）
				//System.out.println("getDocChangeType_FSM() 本地类型改变（文件->目录）:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc是文件, localEntry是目录");
				return DocChangeType.LOCALFILETODIR;
			}
			
			if(remoteEntry == null || remoteEntry.getType() == 0)
			{
				if(isDirLocalChanged(repos, dbDoc))
				{
					//远程删除，但同时本地目录有修改
					//System.out.println("getDocChangeType_FSM() 远程删除，但本地目录有改动:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc/localEntry是目录但不一致, remoteEntry不存在");
					return DocChangeType.LOCALCHANGE;
				}
				
				//远程删除
				if(repos.getVerCtrl() == 2)
				{
					//GIT 仓库无法识别空目录，因此如果是空目录则认为没有改变（不存在、文件也会被认为是空目录）
					if(FileUtil.isEmptyDir(doc.getLocalRootPath() + doc.getPath() + doc.getName(), false))
					{
						//System.out.println("getDocChangeType_FSM() 没有变化:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc/localEntry是空目录且一致, remoteEntry不存在");
						return DocChangeType.NOCHANGE;
					}
				}
				//System.out.println("getDocChangeType_FSM() 远程删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc/localEntry是目录且一致, remoteEntry不存在");
				return DocChangeType.REMOTEDELETE;
			}
			
			if(remoteEntry.getType() == 1)
			{
				if(isDirLocalChanged(repos, dbDoc))
				{
					//远程目录 类型变化（目录被删除并增加了同名文件），但同时本地目录有修改
					//System.out.println("getDocChangeType_FSM() 远程类型改变（目录->文件），但本地目录有改动:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc/localEntry是目录但不一致, remoteEntry是文件");
					return DocChangeType.LOCALCHANGE;
				}
				
				//远程目录 类型变化（目录被删除并增加了同名文件）
				//System.out.println("getDocChangeType_FSM() 远程类型改变（目录->文件）:" + doc.getDocId() + " " + doc.getPath() + doc.getName() + " dbDoc/localEntry是目录且一致, remoteEntry是文件");
				return DocChangeType.REMOTEDIRTOFILE;
			}
			
			//未变更
			//System.out.println("getDocChangeType_FSM() 未变更(dbDoc存在/localDoc是目录/remoteDoc是目录):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return DocChangeType.NOCHANGE;
		}
		
		//未知文件类型(localDoc.type !=1/2)
		//System.out.println("getDocChangeType_FSM() 本地未知文件类型(" + localEntry.getType()+ "):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
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

	protected boolean syncupScanForSubDocs_FSM(Repos repos, Doc doc, User login_user, ReturnAjax rt, HashMap<Long, DocChange> remoteChanges, HashMap<Long, DocChange> localChanges, int subDocSyncFlag) 
	{
		//System.out.println("************************ SyncUpSubDocs_FSM()  " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " subDocSyncFlag:" + subDocSyncFlag);

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
		HashMap<Long, Doc> remoteDocHashMap = null;		

				
		List<Doc> localEntryList = getLocalEntryList(repos, doc);
		//Log.printObject("SyncUpSubDocs_FSM() localEntryList:", localEntryList);
    	if(localEntryList == null)
    	{
    		System.out.println("SyncUpSubDocs_FSM() localEntryList 获取异常:");
        	return false;
    	}

		List<Doc> dbDocList = getDBEntryList(repos, doc);
		//Log.printObject("SyncUpSubDocs_FSM() dbEntryList:", dbDocList);

		//注意: 如果仓库没有版本仓库则不需要远程同步
		List<Doc> remoteEntryList = null;
    	boolean isRemoteSyncUpNeed = isRemoteSyncupNeed(repos);
    	
    	if(isRemoteSyncUpNeed)
		{
    		remoteEntryList = getRemoteEntryList(repos, doc);
    	    //Log.printObject("SyncUpSubDocs_FSM() remoteEntryList:", remoteEntryList);
        	if(remoteEntryList == null)
        	{
        		System.out.println("SyncUpSubDocs_FSM() remoteEntryList 获取异常:");
            	return false;
        	}        	
		}

    	//将dbDocList\localEntryList\remoteEntryList转成HashMap
		localDocHashMap =  ConvertDocListToHashMap(localEntryList);	
		dbDocHashMap = ConvertDocListToHashMap(dbDocList);	
		if(isRemoteSyncUpNeed)	//如果不需要远程同步则直接将remoteHashMap设置成dbHashMap来避免远程同步
		{
			remoteDocHashMap = ConvertDocListToHashMap(remoteEntryList);					
		}
		else
		{
			remoteDocHashMap = dbDocHashMap;
		}

		
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();	//the doc already syncUped		
		//System.out.println("SyncUpSubDocs_FSM() syncupScanForDocList_FSM for remoteEntryList");
        syncupScanForDocList_FSM(remoteEntryList, docHashMap, repos, dbDocHashMap, localDocHashMap, remoteDocHashMap, login_user, rt, remoteChanges, localChanges, subDocSyncFlag);
		
        //System.out.println("SyncUpSubDocs_FSM() syncupScanForDocList_FSM for localEntryList");
        syncupScanForDocList_FSM(localEntryList, docHashMap, repos, dbDocHashMap, localDocHashMap, remoteDocHashMap, login_user, rt, remoteChanges, localChanges, subDocSyncFlag);
		
        //System.out.println("SyncUpSubDocs_FSM() syncupScanForDocList_FSM for dbDocList");
        syncupScanForDocList_FSM(dbDocList, docHashMap, repos, dbDocHashMap, localDocHashMap, remoteDocHashMap, login_user, rt, remoteChanges, localChanges, subDocSyncFlag);

		return true;
    }
	
	private boolean isRemoteSyncupNeed(Repos repos) {
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

	boolean syncupScanForDocList_FSM(List<Doc> docList, HashMap<String, Doc> docHashMap, Repos repos, HashMap<Long, Doc> dbDocHashMap, HashMap<Long, Doc> localDocHashMap, HashMap<Long, Doc> remoteDocHashMap, User login_user, ReturnAjax rt, HashMap<Long, DocChange> remoteChanges, HashMap<Long, DocChange> localChanges, int subDocSyncFlag)
	{
		if(docList == null)
		{
			return true;
		}
		
	    for(int i=0;i<docList.size();i++)
	    {
    		Doc subDoc = docList.get(i);
    		//System.out.println("syncupDocChangeForDocList_FSM() subDoc:" + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
    		
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
    		syncupScanForDoc_FSM(repos, subDoc, dbDoc, localEntry, remoteEntry, login_user, rt, remoteChanges, localChanges, subDocSyncFlag);
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
			System.out.println("syncUpRemoteChange_FSM() remote Added: " + remoteEntry.getPath()+remoteEntry.getName());	
			localParentPath = Path.getReposRealPath(repos) + remoteEntry.getPath();
			successDocList = verReposCheckOut(repos, false, remoteEntry, localParentPath, remoteEntry.getName(), null, true, false, null);
			if(successDocList != null)
			{
				dbAddDoc(repos, remoteEntry, true, false);
				return true;
			}
			return false;
		case REMOTEDELETE: //Remote Deleted
			System.out.println("syncUpRemoteChange_FSM() remote deleted: " + doc.getPath()+doc.getName());
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
				System.out.println("syncUpRemoteChange_FSM() Git仓库无法识别空目录，因此只删除子目录: " + doc.getPath()+doc.getName());
				deleteSubDoc(repos, doc, rt);			
			}	
			return true;
		case REMOTECHANGE: //Remote File Changed
			System.out.println("syncUpRemoteChange_FSM() remote Changed: " + doc.getPath()+doc.getName());
			
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
			System.out.println("syncUpRemoteChange_FSM() remote Type Changed: " + doc.getPath()+doc.getName());
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
			//System.out.println("getRemoteChangeType() no verCtrl");
			return DocChangeType.NOCHANGE;
		}
		
		if(dbDoc == null)
		{
			if(remoteEntry != null && remoteEntry.getType() != 0)
			{
				//System.out.println("getRemoteChangeType() 远程文件/目录新增:"+remoteEntry.getName());
				return DocChangeType.REMOTEADD;				
			}
			//System.out.println("getRemoteChangeType() 远程文件未变更");
			return DocChangeType.NOCHANGE;
		}
		
		if(remoteEntry == null ||remoteEntry.getType() == 0)
		{
			//System.out.println("getRemoteChangeType() 远程文件删除:"+dbDoc.getName());
			if(repos.getVerCtrl() == 2)
			{
				//System.out.println("FileUtil.isEmptyDir() dirPath:" + dirPath);
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
				//System.out.println("getRemoteChangeType() 远程文件类型改变(目录->文件):"+remoteEntry.getName());
				return DocChangeType.REMOTEDIRTOFILE;
			}
			
			if(isDocRemoteChanged(repos, dbDoc, remoteEntry))
			{
				//System.out.println("getRemoteChangeType() 远程文件内容修改:"+remoteEntry.getName());
				return DocChangeType.REMOTECHANGE;
			}
			
			//System.out.println("getRemoteChangeType() 远程文件未变更:"+remoteEntry.getName());
			return DocChangeType.NOCHANGE;
		case 2:
			if(dbDoc.getType() == null || dbDoc.getType() != 2)
			{
				//System.out.println("getRemoteChangeType() 远程文件类型改变(文件->目录):"+remoteEntry.getName());
				return DocChangeType.REMOTEFILETODIR;
			}

			//System.out.println("getRemoteChangeType() 远程目录未变更:"+remoteEntry.getName());
			return DocChangeType.NOCHANGE;
		}
		
		//System.out.println("getRemoteChangeType() 远程文件类型未知:"+dbDoc.getName());
		return DocChangeType.UNDEFINED;
	}

	protected Doc fsGetDoc(Repos repos, Doc doc) 
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
	
		String localParentPath = doc.getLocalRootPath() + doc.getPath();
		File localEntry = new File(localParentPath,doc.getName());
		if(localEntry.exists())
		{
			localDoc.setSize(localEntry.length());
			localDoc.setLatestEditTime(localEntry.lastModified());
			localDoc.setType(localEntry.isDirectory()? 2 : 1);
		}
		return localDoc;
	}
	
	protected Doc docSysGetDoc(Repos repos, Doc doc) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:	//文件系统前置只是文件管理系统类型的特殊形式（版本管理）
			return fsGetDoc(repos, doc);
		case 3:
		case 4:
			return verReposGetDoc(repos, doc, null);
		//case 5:// FTP 前置
		//case 6:// SFTP 前置
		//case 7:// SMB 前置 (共享目录)
		}
		
		return null;
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
		System.out.println("verReposPullPush() verCtrl:" + verCtrl + " isRemote:" + isRemote);
		
		if(verCtrl != 2 || isRemote != 1)
		{
			System.out.println("verReposPullPush() 非GIT远程仓库无需PullPush");
			return true;
		}
		
		return gitPullPush(repos, isRealDoc);
	}
	
	private boolean gitPullPush(Repos repos, boolean isRealDoc) {
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, isRealDoc, "") == false)
		{
			System.out.println("gitPull() GITUtil Init failed");
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
			System.out.println("svnGetDoc() svnUtil.Init失败！");	
			return null;
		}

		return svnUtil.getLatestRevision(doc);		
	}
	
	private String gitGetDocLatestRevision(Repos repos, Doc doc) {
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, doc.getIsRealDoc(), "") == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Init failed");
			return null;
		}
		
		return gitUtil.getLatestRevision(doc);		
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
		//System.out.println("svnGetDoc() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, true, "") == false)
		{
			System.out.println("svnGetDoc() svnUtil.Init失败！");	
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
			System.out.println("gitRealDocCommit() GITUtil Init failed");
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
		List<Doc> list = LuceneUtil2.getDocList(repos, qDoc, indexLib);
		if(list == null || list.size() == 0)
		{
			return null;
		}
		
		if(dupCheck)
		{
			if(list.size() > 1)
			{
				System.out.println("indexGetDoc() indexLib存在多个DOC记录(" + doc.getName() + ")，自动清理"); 
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
				System.out.println("dbGetDoc() 数据库存在多个DOC记录(" + doc.getName() + ")，自动清理"); 
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
		if(repos.getType() != 1)
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

    	Date date1 = new Date();
		if(reposService.addDoc(doc) == 0)
		{
			System.out.println("dbAddDoc() addDoc to db failed");		
			return false;
		}
    	Date date2 = new Date();
        System.out.println("增加文件节点耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
		
		if(addSubDocs)
		{
			List<Doc> subDocList = docSysGetDocList(repos, doc);			
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
		if(repos.getType() != 1)
		{
			return true;
		}

		if(deleteSubDocs)
		{
			String subDocParentPath = doc.getPath() + doc.getName() + "/";
			if(doc.getName().isEmpty())
			{
				subDocParentPath = doc.getPath();
			}
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
						System.out.println("dbDeleteDoc() 系统错误: subDoc name is empty" + subDoc.getDocId());
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
		if(repos.getType() != 1)
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
			System.out.println("dbUpdateDoc() 非法docId，删除该数据库记录:" + doc.getDocId()  + " " + doc.getPath() + doc.getName());
			dbDeleteDoc(repos, doc, false);
			return true;
		}
		
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			System.out.println("dbUpdateDoc() get localEntry 异常 for " + doc.getDocId()  + " " + doc.getPath() + doc.getName());
			return false;
		}
		
		if(localEntry.getType() == 0)
		{
			//这次commit是一个删除操作
			System.out.println("dbUpdateDoc() 本地文件/目录删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
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
				System.out.println("dbUpdateDoc() 本地新增文件/目录:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				return dbAddDoc(repos, doc, true, true);
			}
			return true;
		}
		
		//type not matched, do delete it and add it
		if(dbDoc.getType() != localEntry.getType())
		{
			System.out.println("dbUpdateDoc() 本地文件/目录类型改变:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
			if(dbDeleteDoc(repos, dbDoc, true) == false)
			{
				System.out.println("dbUpdateDoc() 删除dbDoc失败:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				return false;
			}
			return  dbAddDoc(repos, doc, true, false);	
		}
		
		if(localEntry.getType() == 1 || localEntry.getType() == 2)
		{
			System.out.println("dbUpdateDoc() 本地文件/目录修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
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
		
		System.out.println("dbUpdateDoc() 未知文件类型:" + doc.getType() + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
		return false;
	}

	private static Long buildDocId(String path, String name) 
	{
		int level = Path.getLevelByParentPath(path);
		return Path.buildDocIdByName(level, path, name);
	}

	private boolean dbMoveDoc(Repos repos, Doc srcDoc, Doc dstDoc) 
	{
		if(repos.getType() != 1)
		{
			return true;
		}
		
		dbDeleteDoc(repos, srcDoc,true);
		return dbAddDoc(repos, dstDoc, true, false);
	}
	
	private boolean dbCopyDoc(Repos repos, Doc srcDoc, Doc dstDoc, User login_user, ReturnAjax rt) {
		if(repos.getType() != 1)
		{
			return true;
		}

		return dbAddDoc(repos, dstDoc, true, false);
	}
	
	private boolean dbDeleteDocEx(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser, boolean deleteSubDocs) 
	{
		if(repos.getType() != 1)
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
		
		//Build ActionList for RDocIndex/VDoc/VDocIndex/VDocVerRepos delete
		BuildMultiActionListForDocDelete(actionList, repos, doc, commitMsg, commitUser, false);

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
				if(reposId != docShare.getVid())
				{
					System.out.println("checkAndGetAccessInfo() reposId not matched");
					rt.setError("非法仓库访问");
					return null;
				}
			}
			
			//文件非法访问检查: 不能访问分享文件的上层目录或者同层的其他文件
			System.out.println("checkAndGetAccessInfo() forceCheck:" + forceCheck);
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
						System.out.println("checkAndGetAccessInfo() 非法访问路径 accessPath:" + accessPath);
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
			System.out.println("getShareAuth() docShare is null！");
			return null;
		}
		
		String shareAuth = docShare.getShareAuth();
		if(shareAuth == null || shareAuth.isEmpty())
		{
			System.out.println("getShareAuth() docShareAuth 未设置！");
			return null;
		}
		
		System.out.println("getShareAuth() shareAuth:" + shareAuth);

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
			System.out.println("verifyDocShare() docShare is null");
			rt.setError("无效文件分享");
			return false;
		}
		
		if(docShare.getVid() == null)
		{
			System.out.println("verifyDocShare() docShare.vid is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}
		
		if(docShare.getDocId() == null)
		{
			System.out.println("verifyDocShare() docShare.docId is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}

		if(docShare.getPath() == null)
		{
			System.out.println("verifyDocShare() docShare.path is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}

		if(docShare.getName() == null)
		{
			System.out.println("verifyDocShare() docShare.name is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}
		
		if(docShare.getSharedBy() == null)
		{
			System.out.println("verifyDocShare() docShare.sharedBy is null");
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
				System.out.println("verifyDocShare() docShare is expired");
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
		System.out.println("executeDBAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());

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
			System.out.println("executeIndexAction() 文件名:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    		return executeIndexActionForDocName(action, rt);
    	case REALDOC: //RDoc
			System.out.println("executeIndexAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    		return executeIndexActionForRDoc(action, rt);
		case VIRTURALDOC: //VDoc
			System.out.println("executeIndexAction() 虚文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return executeIndexActionForVDoc(action, rt);
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
			System.out.println("executeFSAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return executeLocalActionForRDoc(action, rt);
		case VIRTURALDOC: //VDoc
			System.out.println("executeFSAction() 虚文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return executeLocalActionForVDoc(action, rt);
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
	
	private boolean executeLocalActionForVDoc(CommonAction action, ReturnAjax rt)
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
			return moveVirtualDoc(repos, doc, newDoc, rt);
		case COPY: //Copy Doc
			return copyVirtualDoc(repos, doc, newDoc, rt);
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
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return updateDoc_FSM(repos, doc,
					uploadFile,
					chunkNum, chunkSize, chunkParentPath, 
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}
	
	//底层updateDoc接口
	public boolean updateDocEx(Repos repos, Doc doc,
								byte [] docData,
								Integer chunkNum, Long chunkSize, String chunkParentPath, 
								String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return updateDocEx_FSM(repos, doc,
					docData,
					chunkNum, chunkSize, chunkParentPath, 
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	protected boolean updateDoc_FSM(Repos repos, Doc doc,
				MultipartFile uploadFile,
				Integer chunkNum, Long chunkSize, String chunkParentPath, 
				String commitMsg,String commitUser,User login_user, ReturnAjax rt,
				List<CommonAction> actionList) 
	{	
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		synchronized(syncLock)
		{
			//Try to lock the doc
			docLock = lockDoc(doc, lockType, 2*60*60*1000, login_user, rt,false); //lock 2 Hours 2*60*60*1000
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); 
	
				System.out.println("updateDoc_FSM() lockDoc " + doc.getName() +" Failed！");
				return false;
			}
			SyncLock.unlock(syncLock); 
		}

		//get RealDoc Full ParentPath
		String reposRPath =  Path.getReposRealPath(repos);		

		//保存文件信息
		if(updateRealDoc(repos, doc, uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
		{
			unlockDoc(doc, lockType, login_user);

			System.out.println("updateDoc_FSM() FileUtil.saveFile " + doc.getName() +" Failed, unlockDoc Ok");
			rt.setError("Failed to updateRealDoc " + doc.getName());
			return false;
		}
		
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		//Get latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setLatestEditTime(fsDoc.getLatestEditTime());

		//需要将文件Commit到版本仓库上去
		String revision = verReposDocCommit(repos, false, doc, commitMsg,commitUser,rt, true, null, 2, null);
		if(revision == null)
		{
			Log.docSysDebugLog("updateDoc_FSM() verReposRealDocCommit Failed:" + doc.getPath() + doc.getName(), rt);
			Log.docSysWarningLog("verReposRealDocCommit Failed", rt);	
		}
		else
		{
			//updateDoc Info
			doc.setRevision(revision);
			if(dbUpdateDoc(repos, doc, true) == false)
			{
				Log.docSysWarningLog("updateDoc_FSM() updateDocInfo Failed", rt);
			}
			dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
			//Insert Push Action
			CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
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
		synchronized(syncLock)
		{
			//Try to lock the doc
			docLock = lockDoc(doc, lockType, 2*60*60*1000, login_user, rt,false); //lock 2 Hours 2*60*60*1000
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); 
	
				System.out.println("updateDoc_FSM() lockDoc " + doc.getName() +" Failed！");
				return false;
			}
			SyncLock.unlock(syncLock); 
		}
	
		//get RealDoc Full ParentPath
		String reposRPath =  Path.getReposRealPath(repos);		
	
		//保存文件信息
		if(updateRealDoc(repos, doc, docData,chunkNum,chunkSize,chunkParentPath,rt) == false)
		{
			unlockDoc(doc, lockType, login_user);
	
			System.out.println("updateDoc_FSM() FileUtil.saveFile " + doc.getName() +" Failed, unlockDoc Ok");
			rt.setError("Failed to updateRealDoc " + doc.getName());
			return false;
		}
		
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		//Get latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
	
		//需要将文件Commit到版本仓库上去
		String revision = verReposDocCommit(repos, false, doc, commitMsg,commitUser,rt, true, null, 2, null);
		if(revision == null)
		{
			Log.docSysDebugLog("updateDoc_FSM() verReposRealDocCommit Failed:" + doc.getPath() + doc.getName(), rt);
			Log.docSysWarningLog("verReposRealDocCommit Failed", rt);	
		}
		else
		{
			//updateDoc Info
			doc.setRevision(revision);
			if(dbUpdateDoc(repos, doc, true) == false)
			{
				Log.docSysWarningLog("updateDoc_FSM() updateDocInfo Failed", rt);
			}
			dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
			//Insert Push Action
			CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
		}
		
		//Build DocUpdate action
		BuildMultiActionListForDocUpdate(actionList, repos, doc, reposRPath);
		
		unlockDoc(doc, lockType, login_user);
		
		return true;
	}
		
	protected boolean renameDoc(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) {
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	moveDoc_FSM(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}
	

	protected boolean moveDoc(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) {
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	moveDoc_FSM(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	private boolean moveDoc_FSM(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user,
			ReturnAjax rt, List<CommonAction> actionList) 
	{
		DocLock srcDocLock = null;
		DocLock dstDocLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		synchronized(syncLock)
		{
			//Try to lock the srcDoc
			srcDocLock = lockDoc(srcDoc, lockType, 2*60*60*1000,login_user,rt,true);
			if(srcDocLock == null)
			{
				SyncLock.unlock(syncLock); 
		
				Log.docSysDebugLog("moveDoc_FSM() lock srcDoc " + srcDoc.getName() + " Failed", rt);
				return false;
			}
			
			dstDocLock = lockDoc(dstDoc, lockType, 2*60*60*1000,login_user,rt,true);
			if(dstDocLock == null)
			{
				SyncLock.unlock(syncLock); 
				Log.docSysDebugLog("moveDoc_FSM() lock dstDoc " + dstDoc.getName() + " Failed", rt);
				unlockDoc(srcDoc, lockType, login_user);
				return false;
			}
			
			SyncLock.unlock(syncLock); 
		}
		
		if(moveRealDoc(repos, srcDoc, dstDoc, rt) == false)
		{
			unlockDoc(srcDoc, lockType, login_user);
			unlockDoc(dstDoc, lockType, login_user);

			Log.docSysErrorLog("moveDoc_FSM() moveRealDoc " + srcDoc.getName() + " to " + dstDoc.getName() + " 失败", rt);
			return false;
		}
		
		String revision = verReposDocMove(repos, true, srcDoc, dstDoc,commitMsg, commitUser,rt, null);
		if(revision == null)
		{
			Log.docSysWarningLog("moveDoc_FSM() verReposRealDocMove Failed", rt);
		}
		else
		{
			dstDoc.setRevision(revision);
			if(dbMoveDoc(repos, srcDoc, dstDoc) == false)
			{
				Log.docSysWarningLog("moveDoc_FSM() dbMoveDoc failed", rt);			
			}
			dbCheckAddUpdateParentDoc(repos, dstDoc, null, actionList);
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
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	copyDoc_FSM(repos, srcDoc, dstDoc,
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	protected boolean copyDoc_FSM(Repos repos, Doc srcDoc, Doc dstDoc,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList)
	{				
		//Set the doc Creator and LasteEditor
		dstDoc.setCreator(login_user.getId());
		dstDoc.setCreatorName(login_user.getName());
		dstDoc.setLatestEditor(login_user.getId());
		dstDoc.setLatestEditorName(login_user.getName());
		
		DocLock srcDocLock = null;
		DocLock dstDocLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		synchronized(syncLock)
		{
			//Try to lock the srcDoc
			srcDocLock = lockDoc(srcDoc, lockType, 2*60*60*1000,login_user,rt,true);
			if(srcDocLock == null)
			{
				SyncLock.unlock(syncLock); 
		
				System.out.println("copyDoc_FSM() lock srcDoc " + srcDoc.getName() + " Failed");
				return false;
			}
			
			dstDocLock = lockDoc(dstDoc,1, 2*60*60*1000,login_user,rt,true);
			if(dstDocLock == null)
			{
				SyncLock.unlock(syncLock); 
				System.out.println("copyDoc_FSM() lock dstcDoc " + dstDoc.getName() + " Failed");
				
				unlockDoc(srcDoc, lockType, login_user);
				
				return false;
			}
			
			SyncLock.unlock(syncLock); 
		}
						
		//复制文件或目录
		if(copyRealDoc(repos, srcDoc, dstDoc, rt) == false)
		{
			unlockDoc(srcDoc, lockType, login_user);
			unlockDoc(dstDoc, lockType, login_user);

			System.out.println("copyDoc_FSM() copy " + srcDoc.getName() + " to " + dstDoc.getName() + " 失败");
			rt.setError("copyRealDoc copy " + srcDoc.getName() + " to " + dstDoc.getName() + "Failed");
			return false;
		}
			
		//需要将文件Commit到VerRepos上去
		String revision = verReposDocCopy(repos, true, srcDoc, dstDoc,commitMsg, commitUser,rt, null);
		if(revision == null)
		{
			Log.docSysWarningLog("copyDoc_FSM() verReposRealDocCopy failed", rt);
		}
		else
		{
			dstDoc.setRevision(revision);
			if(dbCopyDoc(repos, srcDoc, dstDoc, login_user, rt) == false)
			{
				Log.docSysWarningLog("copyDoc_FSM() dbCopyDoc failed", rt);			
			}
			dbCheckAddUpdateParentDoc(repos, dstDoc, null, actionList);
		}
		
		//Build Async Actions For RealDocIndex\VDoc\VDocIndex Add
		BuildMultiActionListForDocCopy(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, false);
		
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
		synchronized(syncLock)
		{
			//Try to lock Doc
			docLock = lockDoc(doc, lockType, 1*60*60*1000, login_user,rt,false);
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); 
	
				System.out.println("updateRealDocContent() lockDoc Failed");
				return false;
			}
			SyncLock.unlock(syncLock); 
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
		
		if(saveRealDocContent(repos, doc, rt) == true)
		{
			doc.setLatestEditor(login_user.getId());
			doc.setLatestEditorName(login_user.getName());
			
			//Get latestEditTime
			Doc fsDoc = fsGetDoc(repos, doc);
			doc.setLatestEditTime(fsDoc.getLatestEditTime());

			//需要将文件Commit到版本仓库上去
			String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser,rt, true, null, 2, null);
			if(revision == null)
			{
				Log.docSysDebugLog("updateRealDocContent_FSM() verReposRealDocCommit Failed:" + doc.getPath() + doc.getName(), rt);
				Log.docSysWarningLog("verReposRealDocCommit Failed", rt);	
			}
			else
			{
				//updateDoc Info
				doc.setRevision(revision);
				doc.setContent(null); //实体文件的内容不能放入数据库
				if(dbUpdateDoc(repos, doc, true) == false)
				{
					Log.docSysWarningLog("updateRealDocContent_FSM() updateDocInfo Failed", rt);
				}
				dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
				//Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
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
		synchronized(syncLock)
		{
			//Try to lock Doc
			docLock = lockDoc(doc, lockType, 1*60*60*1000, login_user,rt,false);
			if(docLock == null)
			{
				SyncLock.unlock(syncLock); 
	
				System.out.println("updateVirualDocContent() lockDoc Failed");
				return false;
			}
			SyncLock.unlock(syncLock); 
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
	
	/************************ DocSys仓库与文件锁定接口 *******************************/
	//Lock Doc
	protected DocLock lockRepos(Repos repos, Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean docLockCheckFlag) {
		System.out.println("lockRepos() Repos:" + repos.getName() + " lockType:" + lockType + " login_user:" + login_user.getName() + " docLockCheckFlag:" + docLockCheckFlag);

		//仓库锁使用了和DocLock相同的数据结构，因此借用了docLock的接口
		DocLock reposLock = getReposLock(repos);
		if(reposLock != null && isDocLocked(reposLock, lockType, login_user,rt))
		{
			System.out.println("lockRepos() Repos " + repos.getName() +" was locked");
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
		long lockTime = new Date().getTime() + lockDuration;
		int lockState = getLockState(lockType);
		if(reposLock == null)
		{
			reposLock = new DocLock();
			reposLock.setVid(repos.getId());
			reposLock.setState(lockState);
			reposLock.locker[lockType] = login_user.getName();
			reposLock.lockBy[lockType] = login_user.getId();
			reposLock.lockTime[lockType] = lockTime;	//Set lockTime
			addReposLock(repos, reposLock);			
		}
		else
		{
			int curLockState = reposLock.getState();
			reposLock.setState(curLockState | lockState);
			reposLock.locker[lockType] = login_user.getName();
			reposLock.lockBy[lockType] = login_user.getId();
			reposLock.lockTime[lockType] = lockTime;	//Set lockTime
		}
		
		System.out.println("lockRepos() " + repos.getName() + " success lockType:" + lockType + " by " + login_user.getName());
		return reposLock;
	}
	
	private void addReposLock(Repos repos, DocLock reposLock) {
		reposLocksMap.put(repos.getId(), reposLock);
	}
	
	private void deleteReposLock(Repos repos) {
		reposLocksMap.remove(repos.getId());
	}

	private DocLock getReposLock(Repos repos) {
		DocLock reposLock = reposLocksMap.get(repos.getId());
		return reposLock;
	}

	//Unlock Doc
	protected boolean unlockRepos(Repos repos, Integer lockType, User login_user) {
		DocLock reposLock = reposLocksMap.get(repos.getId());
		
		if(reposLock == null)
		{
			return true;
		}
		
		if(reposLock.getState() == 0)
		{
			System.out.println("unlockRepos() repos was not locked:" + reposLock.getState());			
			return true;
		}
		
		Integer lockBy = reposLock.lockBy[lockType];
		Integer curLockState = reposLock.getState();
		Integer lockState = getLockState(lockType);
		if(lockBy != null && lockBy != login_user.getId())
		{
			System.out.println("unlockRepos() repos was not locked by " + login_user.getName());
			return false;
		}

		Integer newLockState = curLockState & (~lockState);
		if(newLockState == 0)
		{
			deleteReposLock(repos);
		}
		System.out.println("unlockRepos() success:" + repos.getName());
		return true;
	}
	
	//Lock Doc
	protected DocLock lockDoc(Doc doc,Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean subDocCheckFlag) {
		System.out.println("lockDoc() doc:" + doc.getName() + " lockType:" + lockType + " login_user:" + login_user.getName() + " subDocCheckFlag:" + subDocCheckFlag);

		if(checkDocLocked(doc, lockType, login_user, subDocCheckFlag, rt))
		{
			return null;
		}
		
		//Do Lock
		DocLock docLock = getDocLock(doc);
		if(docLock == null)
		{
			System.out.println("lockDoc() docLock is null");
			docLock = new DocLock();
			//设置基本信息
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
			docLock.lockTime[lockType] = new Date().getTime() + lockDuration;	//Set lockTime
			addDocLock(doc, docLock);
			System.out.println("lockDoc() " + doc.getName() + " success lockType:" + lockType + " by " + login_user.getName());
			return docLock;
		}
		else
		{
			Log.printObject("lockDoc() docLock:", docLock);
			int curLockState = docLock.getState();
			docLock.setState(curLockState | getLockState(lockType));
			docLock.locker[lockType] = login_user.getName();
			docLock.lockBy[lockType] = login_user.getId();
			docLock.lockTime[lockType] = new Date().getTime() + lockDuration;	//Set lockTime		
			System.out.println("lockDoc() " + doc.getName() + " success lockType:" + lockType + " by " + login_user.getName());
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
		System.out.println("checkDocLocked() repos:" + doc.getVid() + " doc:" + doc.getPath() + doc.getName() + " lockType:" + lockType + " user:" + login_user.getId() + "_" + login_user.getName() + " subDocCheckFlag:" + subDocCheckFlag);
		DocLock docLock = null;
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			System.out.println("checkDocLocked() reposDocLocskMap is null");
			return false;
		}
		
		String docLockId = getDocLockId(doc);
		docLock = reposDocLocskMap.get(docLockId);
		
		//协同编辑只需要检查当前和父节点是否强制锁定即可
		if(login_user.getId().equals(coEditUser.getId()))
		{
			System.out.println("checkDocLocked() is coEditUser");
			return (isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt) || isParentDocForceLocked(doc,login_user,rt));
		}
		
		if(isDocLocked(docLock, lockType, login_user,rt ))
		{
			System.out.println("lockDoc() Doc " + doc.getPath() + doc.getName() +" was locked");
			return true;
		}
		
		//备注文件时平面结构，不需要检查父节点和子节点
		switch(lockType)
		{
		case DocLock.LOCK_TYPE_FORCE:
		case DocLock.LOCK_TYPE_NORMAL:
			//检查其父节点是否强制锁定
			if(isParentDocLocked(doc,login_user,rt))
			{
				System.out.println("lockDoc() Parent Doc of " + doc.getPath() + doc.getName() +" was locked！");				
				return true;
			}
			
			//Check If SubDoc was locked
			if(subDocCheckFlag)
			{
				if(isSubDocLocked(doc,login_user, rt) == true)
				{
					System.out.println("lockDoc() subDoc of " + doc.getPath() + doc.getName() +" was locked！");
					return true;
				}
			}
			break;
		}
		
		return false;
	}
	
	protected static Integer getLockState(Integer lockType) {
		return DocLock.lockStateMap[lockType];
	}

	private void addDocLock(Doc doc, DocLock docLock) {
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			reposDocLocskMap = new ConcurrentHashMap<String, DocLock>();
			docLocksMap.put(doc.getVid(), reposDocLocskMap);
		}
		reposDocLocskMap.put(getDocLockId(doc), docLock);
	}

	public static DocLock getDocLock(Doc doc) {
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			System.out.println("getDocLock() reposDocLocskMap for " + doc.getVid() + " is null");
			return null;
		}
		
		String docLockId = getDocLockId(doc);
		return reposDocLocskMap.get(docLockId);
	}
	
	private void deleteDocLock(Doc doc) {
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			return;
		}
		reposDocLocskMap.remove(getDocLockId(doc));
	}

	private static String getDocLockId(Doc doc) {
		String lockId = doc.getVid() + "_" + doc.getPath() + doc.getName();
		System.out.println("getDocLockId docLockId:" + lockId);
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
		System.out.println("isDocLocked() lockType:" + lockType);
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
			
		String lockTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(docLock.lockTime[lockType]);
		rt.setError(docLock.getPath() + docLock.getName() +" was force locked by [" + docLock.lockBy[lockType] + "] " + docLock.locker[lockType] + " till " + lockTime);
		System.out.println("isDocForceLocked() " + docLock.getPath() + docLock.getName() +" was force locked by [" + docLock.lockBy[lockType] + "] " + docLock.locker[lockType] + " till " + lockTime);

		return true;	
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
		
		if(docLock.lockBy[lockType] == login_user.getId())
		{
			return false;
		}
			
		String lockTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(docLock.lockTime[lockType]);
		rt.setError(docLock.getPath() + docLock.getName() +" was locked by [" + docLock.lockBy[lockType] + "] " + docLock.locker[lockType] + " till " + lockTime);
		System.out.println("isDocLocked() " + docLock.getPath() + docLock.getName() +" was locked by [" + docLock.lockBy[lockType] + "] " + docLock.locker[lockType] + " till " + lockTime);
		return true;	
	}

	public static boolean isLockOutOfDate(long lockTime) {
		//check if the lock was out of date
		long curTime = new Date().getTime();
		//System.out.println("isLockOutOfDate() curTime:"+curTime+" lockTime:"+lockTime);
		if(curTime < lockTime)	//
		{
			return false;
		}

		//Lock 自动失效
		return true;
	}

	//确定parentDoc is Locked
	private boolean isParentDocLocked(Doc doc, User login_user,ReturnAjax rt) 
	{
		Log.printObject("isParentDocLocked() doc:", doc);
		
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			System.out.println("isParentDocLocked() reposDocLocskMap for " + doc.getVid() + " is null");
			return false;
		}
		
		DocLock docLock = null;
		
		//Check if the rootDoc locked
		Integer reposId = doc.getVid();
		Doc tempDoc = new Doc();
		tempDoc.setVid(reposId);
		tempDoc.setLocalRootPath(doc.getLocalRootPath());
		tempDoc.setPath("");
		tempDoc.setName("");
		docLock = reposDocLocskMap.get(getDocLockId(tempDoc));
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
			docLock = reposDocLocskMap.get(getDocLockId(tempDoc));
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
		
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			System.out.println("isParentDocForceLocked() reposDocLocskMap for " + doc.getVid() + " is null");
			return false;
		}
		
		DocLock docLock = null;
		
		//Check if the rootDoc locked
		Integer reposId = doc.getVid();
		Doc tempDoc = new Doc();
		tempDoc.setVid(reposId);
		tempDoc.setLocalRootPath(doc.getLocalRootPath());
		tempDoc.setPath("");
		tempDoc.setName("");
		docLock = reposDocLocskMap.get(getDocLockId(tempDoc));
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
			docLock = reposDocLocskMap.get(getDocLockId(tempDoc));
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

		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null || reposDocLocskMap.size() == 0)
		{
			return false;
		}
		
		String parentDocPath = doc.getName().isEmpty()? "" :doc.getPath() + doc.getName() + "/";
		//遍历所有docLocks
        System.out.println("isSubDocLocked() reposDocLocskMap size:" + reposDocLocskMap.size());
		Iterator<Entry<String, DocLock>> iterator = reposDocLocskMap.entrySet().iterator();
    	while (iterator.hasNext()) 
        {
        	Entry<String, DocLock> entry = iterator.next();
            if(entry != null)
        	{
            	System.out.println("isSubDocLocked reposDocLocskMap entry:" + entry.getKey());
            	DocLock docLock = entry.getValue();
    			if(isSudDocLock(docLock, parentDocPath))
    			{
    				//检查所有的锁
	            	if(isDocLocked(docLock, DocLock.LOCK_TYPE_FORCE, login_user, rt))
	        		{
	        			System.out.println("isSubDocLocked() " + docLock.getName() + " is locked!");
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
			System.out.println("unlockDoc() curDocLock is null ");
			return true;
		}
		
		Integer curLockState = curDocLock.getState();
		if(curLockState == 0)
		{
			deleteDocLock(doc);
			System.out.println("unlockDoc() doc was not locked:" + curDocLock.getState());			
			return true;
		}
		
		int lockState = getLockState(lockType);
		Integer newLockState = curLockState & (~lockState);
		if(newLockState == 0)
		{
			deleteDocLock(doc);
			System.out.println("unlockDoc() success:" + doc.getName());
			return true;
		}
		curDocLock.setState(newLockState);
		System.out.println("unlockDoc() success:" + doc.getName());
		return true;
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
				System.out.println("getUserName() user:" +userId+ "not exists");
				return null;
			}
			return user.getName();
		}
	}

	
	private String getGroupName(Integer groupId) {
		UserGroup group = reposService.getGroupInfo(groupId);
		if(group == null)
		{
			System.out.println("getGroupName() Group:" +groupId+ "not exists");
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
			System.out.println("超级管理员");
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
			System.out.println("超级管理员");
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
			System.out.println("超级管理员");
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
		System.out.println("getUserReposAuth() UserID:"+UserID);
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
		System.out.println("getGroupDispDocAuth() groupId:"+groupId);
		
		DocAuth docAuth = getGroupDocAuth(repos, groupId, doc);	//获取用户真实的权限
		
		if(groupId == 0)
		{
			System.out.println("getGroupDispDocAuth() groupId:"+groupId + " 无效的group权限");
			return null;
		}
		
		String groupName = getGroupName(groupId);
		if(groupName == null)
		{
			System.out.println("getGroupDispDocAuth() groupId:"+groupId + " 不存在，删除reposAuth和docAuth");
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
				System.out.println("getGroupDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置groupId、groupName");
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
		System.out.println("getUserDispDocAuth() UserID:"+UserID);
		
		DocAuth docAuth = getUserDocAuth(repos, UserID, doc);	//获取用户真实的权限
		Log.printObject("getUserDispDocAuth() docAuth:",docAuth);
		
		//Get UserName
		String UserName = getUserName(UserID);
		if(UserName == null)
		{
			System.out.println("getUserDispDocAuth() UserID:"+UserID + " 不存在，删除reposAuth和docAuth");
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
				System.out.println("getUserDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置userID、UserName");
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
		//System.out.println("getRealDocAuth()  reposId:"+ repos.getId() + " userId:" + userId + " groupId:"+ groupId + " docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
		
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
			//System.out.println("getRealDocAuth() curDocId[" + i+ "]:" + curDocId); 
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
		if(tmpAuth.getUploadSize() == null || (auth.getUploadSize() != null && tmpAuth.getUploadSize() > auth.getUploadSize()))
		{
			auth.setUploadSize(tmpAuth.getUploadSize());
		}
		if(tmpAuth.getHeritable()!=null && tmpAuth.getHeritable().equals(1))
		{
			auth.setHeritable(1);
		}	
	}
	
	//这是一个非常重要的底层接口，每个doc的权限都是使用这个接口获取的
	protected DocAuth getDocAuthFromHashMap(Long docId, DocAuth parentDocAuth,HashMap<Long,DocAuth> docAuthHashMap)
	{
		//System.out.println("getDocAuthFromHashMap() docId:" + docId);
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
				System.out.println("getDocAuthFromHashMap() docId:" + docId + "docAuth is null and parentHeritable is null or 0");
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
					System.out.println("getDocAuthFromHashMap() docId:" + docId + " docAuth priority < parentPriority and parentHeritable is null or 0");
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
		System.out.println("createRealDoc() localRootPath:" + doc.getLocalRootPath() + " path:" + doc.getPath() + " name:" + doc.getName());
		
		String name = doc.getName();
		int type = doc.getType();
		
		//获取 doc parentPath
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();

		String localDocPath = localParentPath + name;
		
		if(type == 2) //目录
		{
			if(false == FileUtil.createDir(localDocPath))
			{
				Log.docSysDebugLog("createRealDoc() 目录 " +localDocPath + " 创建失败！", rt);
				return false;
			}				
		}
		else
		{
			if(false == FileUtil.createFile(localParentPath,name))
			{
				Log.docSysDebugLog("createRealDoc() FileUtil.createFile 文件 " + localDocPath + "创建失败！", rt);
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
			Log.docSysDebugLog("deleteRealDoc() FileUtil.FileUtil.delFileOrDir " + localDocPath + "删除失败！", rt);
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
				System.out.println("updateRealDoc() checkFileSizeAndCheckSum Error");
				return false;
			}
			
		} catch (Exception e) {
			System.out.println("updateRealDoc() FileUtil.saveFile " + name +" 异常！");
			Log.docSysDebugLog(e.toString(), rt);
			e.printStackTrace();
			return false;
		}
		
		System.out.println("updateRealDoc() FileUtil.saveFile return: " + retName);
		if(retName == null  || !retName.equals(name))
		{
			System.out.println("updateRealDoc() FileUtil.saveFile " + name +" Failed！");
			return false;
		}
		return true;
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
					System.out.println("updateRealDoc() checkFileSizeAndCheckSum Error1");
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
					System.out.println("updateRealDoc() checkFileSizeAndCheckSum Error2");
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
					System.out.println("updateRealDoc() checkFileSizeAndCheckSum Error3");
					return false;
				}
				
				retName = combineChunks(localDocParentPath,name,chunkNum,chunkSize,chunkParentPath);
			}

			
		} catch (Exception e) {
			System.out.println("updateRealDoc() FileUtil.saveFile " + name +" 异常！");
			Log.docSysDebugLog(e.toString(), rt);
			e.printStackTrace();
			return false;
		}
		
		System.out.println("updateRealDoc() FileUtil.saveFile return: " + retName);
		if(retName == null  || !retName.equals(name))
		{
			System.out.println("updateRealDoc() FileUtil.saveFile " + name +" Failed！");
			return false;
		}
		return true;
	}
	
	protected String combineChunks(String targetParentPath,String fileName, Integer chunkNum,Long chunkSize, String chunkParentPath) {
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
	
	public void deleteChunks(String name, Integer chunkIndex, Integer chunkNum, String chunkParentPath) {
		System.out.println("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		
		if(null == chunkNum || chunkIndex < (chunkNum-1))
		{
			return;
		}
		
		System.out.println("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		try {
	        for(int i = 0; i < chunkNum; i ++)
	        {
	        	String chunkFilePath = chunkParentPath + name + "_" + i;
	        	FileUtil.delFile(chunkFilePath);
	    	}
		} catch (Exception e) {
			System.out.println("deleteChunks() Failed to combine the chunks");
			e.printStackTrace();
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
			System.out.println("isChunkMatched() Exception"); 
			e.printStackTrace();
		} finally {
			if(in != null)
			{
				try {
					in.close();
				} catch (Exception e) {
					e.printStackTrace();
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
			System.out.println("checkFileSizeAndCheckSum() size:" + size + " is not match with ExpectedSize:" + expSize);
			return false;
		}
		return true;
	}
	
	protected boolean moveRealDoc(Repos repos, Doc srcDoc, Doc dstDoc, ReturnAjax rt) 
	{
		String reposRPath = Path.getReposRealPath(repos);
		String srcParentPath = srcDoc.getPath();
		String srcName = srcDoc.getName();
		String dstParentPath = dstDoc.getPath();
		String dstName = dstDoc.getName();
		
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(FileUtil.isFileExist(srcDocPath) == false)
		{
			Log.docSysDebugLog("moveRealDoc() 文件: " + srcDocPath + " 不存在", rt);
			return false;
		}
		
		if(FileUtil.isFileExist(dstDocPath) == true)
		{
			Log.docSysDebugLog("moveRealDoc() 文件: " + dstDocPath + " 已存在", rt);
			return false;
		}
		
		if(FileUtil.moveFileOrDir(reposRPath + srcParentPath,srcName,reposRPath + dstParentPath,dstName,true) == false)	//强制覆盖
		{
			Log.docSysDebugLog("moveRealDoc() move " + srcDocPath + " to "+ dstDocPath + " Failed", rt);
			return false;
		}
		return true;
	}
	
	protected boolean copyRealDoc(Repos repos, Doc srcDoc, Doc dstDoc, ReturnAjax rt) 
	{
		String reposRPath = Path.getReposRealPath(repos);
		String srcParentPath = srcDoc.getPath();
		String srcName = srcDoc.getName();
		String dstParentPath = dstDoc.getPath();
		String dstName = dstDoc.getName();
		
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(FileUtil.isFileExist(srcDocPath) == false)
		{
			Log.docSysDebugLog("copyRealDoc() 文件: " + srcDocPath + " 不存在", rt);
			return false;
		}
		
		if(FileUtil.isFileExist(dstDocPath) == true)
		{
			Log.docSysDebugLog("copyRealDoc() 文件: " + dstDocPath + " 已存在", rt);
			return false;
		}
		

		if(false == FileUtil.copyFileOrDir(srcDocPath, dstDocPath, true))
		{
			Log.docSysDebugLog("copyRealDoc copy " + srcDocPath + " to " + dstDocPath + " 失败", rt);
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
			System.out.println("createVirtualDoc() content is empty");
			return false;
		}
				
		String docVName = Path.getVDocName(doc);
		
		String vDocPath = doc.getLocalVRootPath() + docVName;
		System.out.println("vDocPath: " + vDocPath);
			
		if(false == FileUtil.createDir(vDocPath))
		{
			Log.docSysDebugLog("目录 " + vDocPath + " 创建失败！", rt);
			return false;
		}
		if(FileUtil.createDir(vDocPath + "/res") == false)
		{
			Log.docSysDebugLog("目录 " + vDocPath + "/res" + " 创建失败！", rt);
			return false;
		}
		if(FileUtil.createFile(vDocPath,"content.md") == false)
		{
			Log.docSysDebugLog("目录 " + vDocPath + "/content.md" + " 创建失败！", rt);
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
		return FileUtil.readDocContentFromFile(userTmpDir, officeTextFileName, offset, size);
	}
	
	//RealDoc读取采用自动检测的方案，在线编辑时返回给前端时必须全部转换成UTF-8格式
	protected boolean saveRealDocContent(Repos repos, Doc doc, ReturnAjax rt) 
	{	
		if(doc.getCharset() == null && doc.autoCharsetDetect)
		{
			return FileUtil.saveDocContentToFile(doc.getContent(), doc.getLocalRootPath() + doc.getPath(), doc.getName()); //自动检测编码
		}
		return FileUtil.saveDocContentToFile(doc.getContent(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getCharset());
	}
	protected String readRealDocContent(Repos repos, Doc doc) 
	{
		if(doc.getCharset() == null && doc.autoCharsetDetect)
		{
			return FileUtil.readDocContentFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName()); //自动检测编码
		}
		return FileUtil.readDocContentFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getCharset());
	}
	
	protected String readRealDocContent(Repos repos, Doc doc, int offset, int size) 
	{
		if(doc.getCharset() == null  && doc.autoCharsetDetect)
		{
			return FileUtil.readDocContentFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName(), offset, size);
		}
		return FileUtil.readDocContentFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getCharset(), offset, size);
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
		return FileUtil.readDocContentFromFile(localVRootPath + docVName + "/", "content.md", encode, offset, size);
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
			Log.docSysDebugLog("deleteVirtualDoc() FileUtil.delDir失败 " + localDocVPath, rt);
			return false;
		}
		return true;
	}
	
	protected boolean moveVirtualDoc(Repos repos, Doc doc,Doc newDoc, ReturnAjax rt) 
	{
		String reposVPath = Path.getReposVirtualPath(repos);
		
		String vDocName = Path.getVDocName(doc);
		
		String newVDocName = Path.getVDocName(newDoc);
				
		if(FileUtil.moveFileOrDir(reposVPath, vDocName, reposVPath, newVDocName, true) == false)
		{
			Log.docSysDebugLog("moveVirtualDoc() moveFile " + reposVPath + vDocName+ " to " + reposVPath + newVDocName + " Failed", rt);
			return false;
		}
		return true;
	}
	
	protected boolean copyVirtualDoc(Repos repos, Doc doc,Doc newDoc, ReturnAjax rt) 
	{
		String reposVPath = Path.getReposVirtualPath(repos);
		
		String vDocName = Path.getVDocName(doc);
		
		String newVDocName = Path.getVDocName(newDoc);
		
		String srcDocFullVPath = reposVPath + vDocName;
		String dstDocFullVPath = reposVPath + newVDocName;
		if(FileUtil.copyDir(srcDocFullVPath,dstDocFullVPath,true) == false)
		{
			Log.docSysDebugLog("copyVirtualDoc() FileUtil.copyDir " + srcDocFullVPath +  " to " + dstDocFullVPath + " Failed", rt);
			return false;
		}
		return true;
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
			System.out.println("svnGetHistory() svnUtil.Init Failed");
			return null;
		}
		return svnUtil.getHistoryLogs(doc.getPath() + doc.getName(), 0, -1, maxLogNum);
	}
	
	protected List<LogEntry> gitGetHistory(Repos repos, Doc doc, int maxLogNum) {
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, doc.getIsRealDoc(), null))
		{
			System.out.println("gitGetHistory() gitUtil.Init Failed");
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
			System.out.println("svnGetHistory() svnUtil.Init Failed");
			return null;
		}
		
		return svnUtil.getHistoryDetail(doc, commitId); 
	}
	
	protected List<ChangedItem> gitGetHistoryDetail(Repos repos, Doc doc, String commitId) 
	{
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, doc.getIsRealDoc(), null))
		{
			System.out.println("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		
		return gitUtil.getHistoryDetail(doc, commitId);
	}
	
	protected String verReposDocCommit(Repos repos, boolean convert, Doc doc, String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, DocChange> localChanges, int subDocCommitFlag, List<CommitAction> commitActionList) 
	{	
		doc = docConvert(doc, convert);
		
		int verCtrl = getVerCtrl(repos, doc);
		
		System.out.println("verReposDocCommit verCtrl:"+verCtrl);
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
		if(localChanges == null)
		{
			return "";
		}
		
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
		if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
		{
			return null;
		}

		return verReposUtil.doAutoCommit(doc, commitMsg,commitUser,modifyEnable, localChanges, subDocCommitFlag, commitActionList);
	}
	
	protected String gitDocCommit(Repos repos, Doc doc,	String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, DocChange> localChanges, int subDocCommitFlag, List<CommitAction> commitActionList) 
	{
		boolean isRealDoc = doc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
		{
			return null;
		}
		
		if(verReposUtil.checkAndClearnBranch() == false)
		{
			System.out.println("gitDocCommit() master branch is dirty and failed to clean");
			return null;
		}
		
		String revision =  verReposUtil.doAutoCommit(doc, commitMsg,commitUser,modifyEnable, localChanges, subDocCommitFlag, commitActionList);
		if(revision == null)
		{
			return null;
		}
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
    		System.out.println("svnCheckOut() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		System.out.println("svnCheckOut() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		System.out.println("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		System.out.println("svnCheckOut() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		System.out.println("svnCheckOut() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		Collection<SVNDirEntry> subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	System.out.println("svnCheckOut() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	System.out.println("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	System.out.println("svnCheckOut() try to chekout 根目录 at revision:" + revision);
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
    		System.out.println("gitCheckOut() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		System.out.println("gitCheckOut() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		System.out.println("gitCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		System.out.println("gitCheckOut() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		System.out.println("gitCheckOut() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		TreeWalk subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	System.out.println("gitCheckOut() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	System.out.println("gitCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	System.out.println("gitCheckOut() try to chekout 根目录 at revision:" + revision);
	    		}
	    	}
    	}

		return verReposUtil.getEntry(doc, localParentPath, targetName, revision, force, downloadList);
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
		System.out.println("deleteIndexLib() libPath:" + libPath);
		return LuceneUtil2.deleteIndexLib(libPath);
	}
	
	boolean deleteDocNameIndexLib(Repos repos)
	{
		return deleteIndexLib(repos, 0);
	}
	
	boolean deleteRDocIndexLib(Repos repos)
	{
		return deleteIndexLib(repos, 1);
	}

	boolean deleteVDocIndexLib(Repos repos)
	{
		return deleteIndexLib(repos, 2);
	}

	//Add Index For DocName
	public boolean addIndexForDocName(Repos repos, Doc doc)
	{
		System.out.println("addIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		String indexLib = getIndexLibPath(repos,0);

		return LuceneUtil2.addIndex(doc, doc.getName(), indexLib);
	}

	//Delete Indexs For DocName
	public static boolean deleteIndexForDocName(Repos repos, Doc doc, int deleteFlag)
	{
		System.out.println("deleteIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos,0);

		return LuceneUtil2.deleteIndexEx(doc, indexLib, deleteFlag);
	}
		
	//Update Index For DocName
	public static boolean updateIndexForDocName(Repos repos, Doc doc, Doc newDoc, ReturnAjax rt)
	{
		System.out.println("updateIndexForDocName() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName()  + " newParentPath:" + newDoc.getPath() + " newName:" + newDoc.getName() + " repos:" + repos.getName());

		String indexLib = getIndexLibPath(repos,0);

		String name = doc.getName();
		String newName = newDoc.getName();
		String parentPath = doc.getPath();
		String newParentPath = newDoc.getPath();
		if(name.equals(newName) && parentPath.equals(newParentPath))
		{
			System.out.println("updateIndexForDocName() Doc not Changed docId:" + doc.getDocId() + " parentPath:" + parentPath + " name:" + name + " newParentPath:" + newParentPath + " newName:" + newName);			
			return true;
		}
		
		LuceneUtil2.deleteIndex(doc, indexLib);

		String content = newParentPath + newName;
		return LuceneUtil2.addIndex(newDoc, content.trim(), indexLib);
	}

	//Add Index For VDoc
	public boolean addIndexForVDoc(Repos repos, Doc doc)
	{
		System.out.println("addIndexForVDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());

		String content = doc.getContent();
		if(content == null)
		{
			content = readVirtualDocContent(repos, doc);
		}
		
		String indexLib = getIndexLibPath(repos,2);

		if(content == null || content.isEmpty())
		{
			//System.out.println("addIndexForVDoc() content is null or empty, do delete Index");
			return LuceneUtil2.deleteIndex(doc, indexLib);			
		}
		
		return LuceneUtil2.addIndex(doc, content.toString().trim(), indexLib);
	}
	
	//Delete Indexs For VDoc
	public static boolean deleteIndexForVDoc(Repos repos, Doc doc, int deleteFlag)
	{
		System.out.println("deleteIndexForVDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos,2);
		
		return LuceneUtil2.deleteIndexEx(doc, indexLib, deleteFlag);
	}
	
	//Update Index For VDoc
	public boolean updateIndexForVDoc(Repos repos, Doc doc)
	{
		System.out.println("updateIndexForVDoc() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName() + " repos:" + repos.getName());
		
		if(isVirtuallDocTextSearchDisabled(repos, doc))
		{
			System.out.println("addIndexForRDoc() VirtualDocTextSearchDisabled");
			return false;
		}
		
		String indexLib = getIndexLibPath(repos,2);
		
		String content = doc.getContent();
		if(content == null)
		{
			content = readVirtualDocContent(repos, doc);
		}		
		
		LuceneUtil2.deleteIndex(doc, indexLib);

		return LuceneUtil2.addIndex(doc, content.trim(), indexLib);
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
		System.out.println("addIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
    	if(doc.isRealDocTextSearchEnabled == null)
		{
			doc.isRealDocTextSearchEnabled = isRealDocTextSearchDisabled(repos, doc, true)? 0: 1;
		}
    	else if(doc.isRealDocTextSearchEnabled == 1)	//表明parentDoc is already enabled
    	{
			doc.isRealDocTextSearchEnabled = isRealDocTextSearchDisabled(repos, doc, false)? 0: 1;    		
    	}
    	
    	if(doc.isRealDocTextSearchEnabled == 0)
		{
			System.out.println("addIndexForRDoc() RealDocTextSearchDisabled");
			return false;
		}
		
		
		String indexLib = getIndexLibPath(repos, 1);

		String localRootPath = Path.getReposRealPath(repos);
		String localParentPath = localRootPath + doc.getPath();
		String filePath = localParentPath + doc.getName();
				
		File file =new File(filePath);
		if(!file.exists())
		{
			System.out.println("addIndexForRDoc() " + filePath + " 不存在");
			return false;
		}
		
		if(file.isDirectory())
		{
			//System.out.println("addIndexForRDoc() isDirectory");
			return false; //LuceneUtil2.addIndex(LuceneUtil2.buildDocumentId(hashId,0), reposId, docId, parentPath, name, hashId, "", indexLib);
		}
		
		if(file.length() == 0)
		{
			//System.out.println("addIndexForRDoc() fileSize is 0, do delete index");
			return LuceneUtil2.deleteIndex(doc,indexLib);
		}
		
		//According the fileSuffix to confirm if it is Word/Execl/ppt/pdf
		String fileSuffix = FileUtil.getFileSuffix(doc.getName());
		if(fileSuffix != null)
		{
			//System.out.println("addIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
			switch(fileSuffix)
			{
			case "doc":
				return LuceneUtil2.addIndexForWord(filePath, doc, indexLib);
			case "docx":
				return LuceneUtil2.addIndexForWord2007(filePath, doc, indexLib);
			case "xls":
				return LuceneUtil2.addIndexForExcel(filePath, doc, indexLib);
			case "xlsx":
				return LuceneUtil2.addIndexForExcel2007(filePath, doc, indexLib);
			case "ppt":
				return LuceneUtil2.addIndexForPPT(filePath, doc, indexLib);
			case "pptx":
				return LuceneUtil2.addIndexForPPT2007(filePath, doc, indexLib);
			case "pdf":
				return LuceneUtil2.addIndexForPdf(filePath, doc, indexLib);
			default:
				if(FileUtil.isText(fileSuffix))
				{
					return LuceneUtil2.addIndexForFile(filePath, doc, indexLib);
				}
				break;
			}
		}

		//System.out.println("addIndexForRDoc() 未知文件类型不支持索引");
		return false;
	}
	
	protected Integer isReposTextSearchEnabled(Repos repos) {
		String reposTextSearchConfigPath = Path.getReposTextSearchConfigPath(repos);
		String disableRealDocTextSearchFileName = "0.disableRealDocTextSearch";
		File realDocTextSearchDisableFile = new File(reposTextSearchConfigPath + disableRealDocTextSearchFileName);
		if(!realDocTextSearchDisableFile.exists())
		{
			return 1;
		}
		return 0;
	}

	private static boolean isRealDocTextSearchDisabled(Repos repos, Doc doc, boolean force) {
		if(repos.isTextSearchEnabled == null || repos.isTextSearchEnabled == 0)
    	{
    		System.out.println("isRealDocTextSearchDisabled() " + repos.getId() + " " + repos.getName() + " repos realDocTextSearch disabled");
    		return true;
    	}
		
		
		if(doc.getName().equals("DocSysVerReposes") || doc.getName().equals("DocSysLucene"))
    	{
    		System.out.println("isRealDocTextSearchDisabled() " + doc.getPath() + doc.getName() + " realDocTextSearch disabled");
    		return true;
    	}
		
		String parentPath = Path.getReposTextSearchConfigPath(repos);
		String fileName = doc.getDocId() + ".disableRealDocTextSearch";
		if(FileUtil.isFileExist(parentPath + fileName))
		{
			Log.println("isRealDocTextSearchDisabled() " + doc.getPath() + doc.getName() + " realDocTextSearch disabled");
			return true;
		}

		if(force == false)
		{
			return false;
		}
		
		Log.println("isRealDocTextSearchDisabled() " + doc.getPath() + doc.getName() + " realDocTextSearch enabled");
		if(doc.getDocId() != 0)
		{
			Doc parentDoc = buildBasicDoc(repos.getId(), null, doc.getPid(), doc.getReposPath(), doc.getPath(), "", null, 2, true, null, null, 0L, "");
			return isRealDocTextSearchDisabled(repos, parentDoc, force);
		}
		return false;
	}

	public static boolean deleteIndexForRDoc(Repos repos, Doc doc, int deleteFlag)
	{
		System.out.println("deleteIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos, 1);
			
		return LuceneUtil2.deleteIndexEx(doc,indexLib, deleteFlag);
	}
	
	//Update Index For RDoc
	public static boolean updateIndexForRDoc(Repos repos, Doc doc)
	{
		System.out.println("updateIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());		
		deleteIndexForRDoc(repos, doc, 1);
		return addIndexForRDoc(repos, doc);
	}
	
	/****************************DocSys系统初始化接口 *********************************/
	//static String JDBC_DRIVER = "org.sqlite.JDBC";  
    //static String DB_TYPE = "sqlite";
	//static String DB_URL = "jdbc:sqlite::resource:data/DocSystem"; //classess目录下在eclipse下会导致重启 
	//static String DB_USER = "";
    //static String DB_PASS = "";
    
	static String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";  
    static String DB_TYPE = "mysql";
    static String DB_URL = "jdbc:mysql://localhost:3306/DocSystem?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC";
    static String DB_USER = "root";
    static String DB_PASS = "";
    protected static String officeEditorApi = null;
    protected static String serverIP = null;
    
	
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
				System.out.println("getOfficeEditor() officeEditor not cofigured");				
				return null;
			}
			
			String localOfficeApiPath = docSysWebPath + "web/static/office-editor/web-apps/apps/api/documents/api.js";
			File file = new File(localOfficeApiPath);
			if(file.exists() == false)
			{
				System.out.println("getOfficeEditor() officeEditor not installed");								
				return null;
			}
			
			System.out.println("getOfficeEditor() url:" + request.getRequestURL());
			String url = getHostAndPortFromUrl(request.getRequestURL());
			officeEditor = url + "/DocSystem/web/static/office-editor/web-apps/apps/api/documents/api.js";
			//business edition
			return officeEditor;
		}
		
		System.out.println("getOfficeEditor() officeEditor:" + officeEditor);
		if(testUrlWithTimeOut(officeEditor,3000) == false)
		{	
			System.out.println("getOfficeEditor() test officeEditor connection failed");
			return null;
		}		
		System.out.println("getOfficeEditor() officeEditor is ok");
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
	
	protected static String docSysInit(boolean force) 
	{	
		System.out.println("\n*************** docSysInit force:" + force + " *****************");
		System.out.println("docSysInit() docSysIniPath:" + docSysIniPath);

		if(officeEditorApi == null)
		{
			officeEditorApi = Path.getOfficeEditorApi();
		}
		System.out.println("docSysInit() officeEditorApi:" + officeEditorApi);
		
		
		serverIP = IPUtil.getIpAddress();
		System.out.println("docSysInit() serverIP:" + serverIP);
		
		//检查并更新数据库配置文件
		String JDBCSettingPath = docSysWebPath + "WEB-INF/classes/jdbc.properties";
		String UserJDBCSettingPath = docSysIniPath + "jdbc.properties";
		if(FileUtil.isFileExist(UserJDBCSettingPath))
		{
			String checkSum1 = getFileCheckSum(UserJDBCSettingPath);
			String checkSum2 = getFileCheckSum(JDBCSettingPath);
			//检查UserJDBCSettingPath是否与JDBCSettingPath是否一致，如果不一致则更新应用的数据库配置，等待用户重启服务器
			if(checkSum1 == null || checkSum2 == null || !checkSum1.equals(checkSum2))
			{
				System.out.println("docSysInit() 用户自定义数据库配置文件与系统数据库配置文件不一致，等待重启生效！");
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
			//检查userDocSysConfigPath是否与docSysConfigPath一致，如果不一致则更新
			String checkSum1 = getFileCheckSum(userDocSysConfigPath);
			String checkSum2 = getFileCheckSum(docSysConfigPath);
			if(checkSum1 == null || checkSum2 == null || !checkSum1.equals(checkSum2))
			{
				System.out.println("docSysInit() 用户自定义配置文件与系统默认配置文件不一致，更新文件！");
				FileUtil.copyFile(userDocSysConfigPath, docSysConfigPath, true);
			}
		}
				
		getAndSetDBInfoFromFile(JDBCSettingPath);
		System.out.println("docSysInit() DB_TYPE:" + DB_TYPE + " DB_URL:" + DB_URL);
				
		//Get dbName from the DB URL
		String dbName = getDBNameFromUrl(DB_TYPE, DB_URL);
		System.out.println("docSysInit() dbName:" + dbName);
		
		File docSysIniDir = new File(docSysIniPath);
		if(docSysIniDir.exists() == false)
		{
			//docSysIniDir不存在有两种可能，首次安装或者旧版本版本过低
			docSysIniDir.mkdirs();	
		}
		
		if(initObjMemberListMap() == false)
		{
			System.out.println("docSysInit() initObjMemberListMap Faield!");
			return "ERROR_initObjMemberListMapFailed";			
		}
		System.out.println("docSysInit() initObjMemberListMap done!");
				
		//测试数据库连接
		if(testDB(DB_TYPE, DB_URL, DB_USER, DB_PASS) == false)	//数据库不存在
		{
			System.out.println("docSysInit() testDB failed force:" + force);
			if(force == false)
			{
				System.out.println("docSysInit() testDB failed (SytemtStart triggered docSysInit)");
				//系统启动时的初始化force要设置成false,否则数据库初始化时间过长会导致服务器重启
				System.out.println("docSysInit() 数据库无法连接（数据库不存在或用户名密码错误），进入用户自定义安装页面!");				
				return "ERROR_DBNotExists";
			}
			else
			{
				System.out.println("docSysInit() testDB failed (User triggered docSysInit)");
				
				//自动创建数据库
				createDB(DB_TYPE, dbName, DB_URL, DB_USER, DB_PASS);
				System.out.println("docSysInit() createDB done");

				if(initDB(DB_TYPE, DB_URL, DB_USER, DB_PASS) == false)
				{
					System.out.println("docSysInit() initDB failed");
					return "ERROR_intiDBFailed";
				}
				System.out.println("docSysInit() initDB done");
								
				//更新版本号
				FileUtil.copyFile(docSysWebPath + "version", docSysIniPath + "version", true);	
				System.out.println("docSysInit() updateVersion done");
				return "ok";
			}
		}
		
		//数据库已存在
		System.out.println("docSysInit() checkAndUpdateDB start");
		return checkAndUpdateDB(true);
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
		System.out.println("UserJDBCSettingUpgrade() oldVersion:" + oldVersion);
		if(oldVersion != null && oldVersion > 20147)
		{
			System.out.println("UserJDBCSettingUpgrade() oldVersion larger than 20147, no need upgrage userJDBCSetting");
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
		System.out.println("UserJDBCSettingUpgrade() newUrl:" + newUrl);
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
			System.out.println("checkAndAddFirstUser() 异常");
			return false;
		}
		
		if(list.size() == 0)
		{
			//Add admin User
			User adminUser = buildAdminUser();
			dbInsert(adminUser, DOCSYS_USER, DB_TYPE, DB_URL, DB_USER, DB_PASS);
			if(dbQuery(null, DOCSYS_USER, DB_TYPE, DB_URL, DB_USER, DB_PASS) == null)
			{
				System.out.println("checkAndAddFirstUser() 新增用户失败");
				return false;
			}
		}
		return true;
	}

	private static String checkAndUpdateDB(boolean skipDocTab) {
		//根据里面的版本号信息更新数据库
		Integer newVersion = getVersionFromFile(docSysWebPath, "version");
		System.out.println("checkAndUpdateDB() newVersion:" + newVersion);
		if(newVersion == null)
		{
			System.out.println("checkAndUpdateDB() newVersion is null");
			return "ERROR_newVersionIsNull";
		}
		
		Integer oldVersion = getVersionFromFile(docSysIniPath , "version");
		System.out.println("checkAndUpdateDB() oldVersion:" + oldVersion);
		if(oldVersion == null)
		{
			System.out.println("checkAndUpdateDB() oldVersion is null, 默认为0");
			oldVersion = 0;
		}
		
		if(newVersion.equals(oldVersion))
		{
			System.out.println("checkAndUpdateDB() newVersion is same with oldVersion");
			return "ok";		
		}
		
		System.out.println("checkAndUpdateDB() from " + oldVersion + " to " + newVersion);		
		if(DBUpgrade(oldVersion, newVersion, DB_TYPE, DB_URL, DB_USER, DB_PASS, skipDocTab) == false)
		{
			System.out.println("checkAndUpdateDB() DBUpgrade failed!");					
			return "ERROR_DBUpgradeFailed";
		}
		System.out.println("checkAndUpdateDB() DBUpgrade done!");					
		
		//更新版本号，避免重复升级数据库
		FileUtil.copyFile(docSysWebPath + "version", docSysIniPath + "version", true);
		System.out.println("checkAndUpdateDB() updateVersion done!");					
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
            System.out.println("sql脚本执行完毕");
            ret = true;
        } catch (Exception e) {
            System.out.println("sql脚本执行发生异常");
            e.printStackTrace();
        }finally{
	        // 关闭资源
	        try{
	            if(runner!=null) runner.closeConnection();
	            if(conn!=null) conn.close();
	            if(in!=null) in.close();
	            if(read!=null) read.close();
	        }catch(Exception se){
	            se.printStackTrace();
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
	private static boolean initSqliteTables(String type, String url, String user, String pwd) {
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
    		statement.execute("drop table if exists doc");
    		statement.execute("CREATE TABLE `doc` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `NAME` varchar(200) DEFAULT NULL,\n" +
    				"  `TYPE` int(10) DEFAULT NULL,\n" +
    				"  `SIZE` bigint(20) NOT NULL DEFAULT '0',\n" +
    				"  `CHECK_SUM` varchar(32) DEFAULT NULL,\n" +
    				"  `REVISION` varchar(100) DEFAULT NULL,\n" +
    				"  `CONTENT` varchar(10000) default null,\n" +
    				"  `PATH` varchar(2000) NOT NULL DEFAULT '',\n" +
    				"  `DOC_ID` bigint(20) DEFAULT NULL,\n" +
    				"  `PID` bigint(20) NOT NULL DEFAULT '0',\n" +
    				"  `VID` int(11) DEFAULT NULL,\n" +
    				"  `PWD` varchar(20) DEFAULT NULL,\n" +
    				"  `CREATOR` int(11) DEFAULT NULL,\n" +
    				"  `CREATE_TIME` bigint(20) NOT NULL DEFAULT '0',\n" +
    				"  `LATEST_EDITOR` int(11) DEFAULT NULL,\n" +
    				"  `LATEST_EDIT_TIME` bigint(20) DEFAULT '0'\n" +
    				")");

    		statement.execute("drop table if exists doc_auth");
    		statement.execute("CREATE TABLE `doc_auth` (\n" +
    				"  `ID` integer primary key ,\n" +
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
    				"  `DOC_PATH` varchar(2000) DEFAULT NULL,\n" +
    				"  `DOC_NAME` varchar(200) DEFAULT NULL\n" +
    				"  );");

    		statement.execute("drop table if exists doc_share");
    		statement.execute("CREATE TABLE `doc_share` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `SHARE_ID` int(11) NOT NULL,\n" +
    				"  `NAME` varchar(200) DEFAULT NULL,\n" +
    				"  `PATH` varchar(2000) NOT NULL DEFAULT '',\n" +
    				"  `DOC_ID` bigint(20) DEFAULT NULL,\n" +
    				"  `VID` int(11) DEFAULT NULL,\n" +
    				"  `SHARE_AUTH` varchar(2000) DEFAULT NULL,\n" +
    				"  `SHARE_PWD` varchar(20) DEFAULT NULL,\n" +
    				"  `SHARED_BY` int(11) DEFAULT NULL,\n" +
    				"  `EXPIRE_TIME` bigint(20) NOT NULL DEFAULT '0'\n" +
    				")");

    		statement.execute("drop table if exists doc_lock");
    		statement.execute("CREATE TABLE `doc_lock` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `TYPE` int(10) DEFAULT NULL,\n" +
    				"  `NAME` varchar(200) DEFAULT NULL,\n" +
    				"  `PATH` varchar(2000) NOT NULL DEFAULT '/',\n" +
    				"  `DOC_ID` bigint(20) DEFAULT NULL,\n" +
    				"  `PID` bigint(20) DEFAULT NULL,\n" +
    				"  `VID` int(10) DEFAULT NULL,\n" +
    				"  `STATE` int(1) NOT NULL DEFAULT '1',\n" +
    				"  `LOCKER` varchar(200) DEFAULT NULL,\n" +
    				"  `LOCK_BY` int(11) DEFAULT NULL,\n" +
    				"  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0'\n" +
    				")");

    		statement.execute("drop table if exists group_member");
    		statement.execute("CREATE TABLE `group_member` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `GROUP_ID` int(11) DEFAULT NULL,\n" +
    				"  `USER_ID` int(11) DEFAULT NULL\n" +
    				")");

    		statement.execute("drop table if exists repos");
    		statement.execute("CREATE TABLE `repos` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `NAME` varchar(255) DEFAULT NULL,\n" +
    				"  `TYPE` int(10) DEFAULT '1',\n" +
    				"  `PATH` varchar(2000) NOT NULL DEFAULT 'D:/DocSysReposes',\n" +
    				"  `REAL_DOC_PATH` varchar(2000) DEFAULT NULL,\n" +
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
    				")");

    		statement.execute("drop table if exists repos_auth");
    		statement.execute("CREATE TABLE `repos_auth` (\n" +
    				"  `ID` integer primary key ,\n" +
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
    				")");

    		statement.execute("drop table if exists role;");
    		statement.execute("CREATE TABLE `role` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `NAME` varchar(50) NOT NULL,\n" +
    				"  `ROLE_ID` int(11) NOT NULL\n" +
    				")");

    		statement.execute("drop table if exists sys_config");
    		statement.execute("CREATE TABLE `sys_config` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `REG_ENABLE` int(2) NOT NULL DEFAULT '1',\n" +
    				"  `PRIVATE_REPOS_ENABLE` int(2) NOT NULL DEFAULT '1'\n" +
    				")");

    		statement.execute("drop table if exists user");
    		statement.execute("CREATE TABLE user (\n" +
    				"    ID              INTEGER       PRIMARY KEY,\n" +
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
    				")");

    		statement.execute("drop table if exists user_group");
    		statement.execute("CREATE TABLE `user_group` (\n" +
    				"  `ID` integer primary key ,\n" +
    				"  `NAME` varchar(200) DEFAULT NULL,\n" +
    				"  `TYPE` int(1) DEFAULT NULL,\n" +
    				"  `INFO` varchar(1000) DEFAULT NULL,\n" +
    				"  `IMG` varchar(200) DEFAULT NULL,\n" +
    				"  `PRIORITY` int(2) DEFAULT NULL,\n" +
    				"  `CREATE_TIME` varchar(50) DEFAULT NULL\n" +
    				")");
            ret = true;
        } catch (Exception e) {
            System.out.println("sql脚本执行发生异常");
            e.printStackTrace();
        }finally{
	        // 关闭资源
	        try{
	            if(runner!=null) runner.closeConnection();
	            if(conn!=null) conn.close();
	            if(in!=null) in.close();
	            if(read!=null) read.close();
	        }catch(Exception se){
	            se.printStackTrace();
	        }
	    }
        
		return ret;
	}

	protected static boolean createDB(String dbType, String dbName,String url, String user, String pwd) 
    {
        try {
			Class.forName(getJdbcDriverName(dbType));
		} catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
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
		System.out.println("getAbsoluteSqliteUrl absSqliteUrl:" + absSqliteUrl);
		return absSqliteUrl;
	}
	
	private static String getDbPathFromUrl(String url) {
		System.out.println("getDbPathFromUrl url:" + url);
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
		System.out.println("getDbPathFromUrl dbFilePath:" + dbFilePath);
		
		String[] subStrs = dbFilePath.split("/");
		String relativePath = "";
		//System.out.println("getDbPathFromUrl subStrs[0]:" + subStrs[0]);
		boolean firstFlag = true;	
		for(int i=0; i< subStrs.length-1; i++)
		{	
			Log.println("getDbPathFromUrl subStrs[" + i + "]: " + subStrs[i]);
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
		Log.println("getDbPathFromUrl dbPath:" + dbPath);		
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
	    		System.out.println("createDB " + dbName + " exist!");
	    		stmt.close();
	    		conn.close();
	    		return true;
	    	}

	    	if(stmt.executeUpdate(createdatabase) != 0)		 
	    	{
	    		System.out.println("create table success!");
	    		stmt.close();
	    		conn.close();
	    		return true;
	    	}   
	    	
            // 完成后关闭
            stmt.close();
            conn.close();
        }catch(SQLException se){
            // 处理 JDBC 错误
            se.printStackTrace();
        }catch(Exception e){
            // 处理 Class.forName 错误
            e.printStackTrace();
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
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
			// TODO Auto-generated catch block
			e.printStackTrace();
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
	    		System.out.println("deleteDB " + dbName + " exist!");
		    	if(stmt.executeUpdate(deletedatabase) != 0)		 
		    	{
		    		System.out.println("delete table success!");
		    		ret = true;
		    	}   
	    		stmt.close();
	    		conn.close();
	    	}
	    	else
	    	{
	    		System.out.println("deleteDB " + dbName + " not exist!");
	    		ret = true;
	    	}
	    	// 完成后关闭
            stmt.close();
            conn.close();
        }catch(SQLException se){
            // 处理 JDBC 错误
            se.printStackTrace();
        }catch(Exception e){
            // 处理 Class.forName 错误
            e.printStackTrace();
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
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
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
    
        // 打开链接
        boolean ret = false;
        System.out.println("连接数据库...");
        try {
			conn = getDBConnection(type, url, user, pwd);
			if(conn != null)
			{
				System.out.println("连接数据库成功");
				ret = true;
			}
		} catch (Exception e) {
			System.out.println("连接数据库失败");
			e.printStackTrace();
		} finally{
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
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
		System.out.println("getDBConnection() dbUrl:" + dbUrl);

		
		try {
			return DriverManager.getConnection(dbUrl, user, pwd);
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
	}

	private static String getJdbcDriverName(String type) {
		if(type == null)
		{
			return JDBC_DRIVER;
		}
		switch(type)
		{
		case "sqlite":
			return "org.sqlite.JDBC";
		}
		
		return JDBC_DRIVER;
	}

	private static boolean getAndSetDBInfoFromFile(String JDBCSettingPath) {
		System.out.println("getAndSetDBInfoFromFile " + JDBCSettingPath );
		
		String jdbcDriver = ReadProperties.getValue(JDBCSettingPath, "db.driver");
		if(jdbcDriver == null || "".equals(jdbcDriver))
		{
			return false;
		}
		JDBC_DRIVER = jdbcDriver;
		
		String dbType = ReadProperties.getValue(JDBCSettingPath, "db.type");
		if(dbType == null || "".equals(dbType))
		{
			dbType = "mysql";
		}
		DB_TYPE = dbType;
		
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
		System.out.println("getAndSetDBInfoFromFile JDBC_DRIVER:" + JDBC_DRIVER + " DB_TYPE:" + DB_TYPE + " DB_URL:" + DB_URL + " DB_USER:" + DB_USER + " DB_PASS:" + DB_PASS);
		return true;
	}

	protected static Integer getVersionFromFile(String path, String name) 
	{
		System.out.println("getVersionFromFile() file:" + path + name);

		String versionStr = FileUtil.readDocContentFromFile(path, name, "UTF-8");
		System.out.println("getVersionFromFile() versionStr:" + versionStr);

		if(versionStr == null || versionStr.isEmpty())
		{
			return null;
		}
		
		versionStr = versionStr.trim();
		
		int version = 0;
		String [] versions = versionStr.split("\\."); //.需要转义
		//System.out.println("getVersionFromFile() versions.length:" + versions.length); 
		
		for(int i=0; i<versions.length; i++)
		{
			//xx.xx.xx超过3级的忽略
			if(i > 2)
			{
				break;
			}
			
			String tmp = versions[i];
			//System.out.println("getVersionFromFile() tmp:" + tmp);

			if(tmp.isEmpty())
			{
				//非法版本号
				return null;
			}
			
			int tmpVersion = Integer.parseInt(tmp);
			//System.out.println("getVersionFromFile() tmpVersion:" + tmpVersion);
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
			//System.out.println("getVersionFromFile() tmpVersion:" + tmpVersion);
			
			version += tmpVersion;
		}
		
		System.out.println("getVersionFromFile() version:" + version);
		return version;
	}

	protected static boolean DBUpgrade(Integer oldVersion, Integer newVersion, String type, String url, String user, String pwd, boolean skipDocTab)
	{
		System.out.println("DBUpgrade() from " + oldVersion + " to " + newVersion);
		List<Integer> dbTabsNeedToUpgrade = getDBTabListForUpgarde(oldVersion, newVersion);
		if(dbTabsNeedToUpgrade == null || dbTabsNeedToUpgrade.size() == 0)
		{
			System.out.println("DBUpgrade() no DB Table need to upgrade from " + oldVersion + " to " + newVersion);
			return true;
		}
		
		//backupDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, skipDocTab) == false)
		{
			System.out.println("DBUpgrade() 数据库备份失败!");
			return true;
		}
		
		//更新数据库表结构
		for(int i=0; i< dbTabsNeedToUpgrade.size(); i++)
		{
			int dbTabId = dbTabsNeedToUpgrade.get(i);
			String dbTabName = getNameByObjType(dbTabId);
			
			//更新数据库表结构
			//check if init script exists
			String dbTabInitSqlScriptName = "docsystem_" + dbTabName.toUpperCase() + ".sql";
			String sqlScriptPath = docSysWebPath + "WEB-INF/classes/config/" + dbTabInitSqlScriptName;
			if(FileUtil.isFileExist(sqlScriptPath) == false)
			{
				System.out.println("DBUpgrade() sqlScriptPath:" + sqlScriptPath + " 不存在");
				continue;
			}
			//delete tab
			deleteDBTab(dbTabName, type, url, user, pwd);
			//init tab
			executeSqlScript(sqlScriptPath, type, url, user, pwd);
		}
		
		//导入数据
		importDatabaseFromJsonFile(dbTabsNeedToUpgrade, backUpPath, "docsystem_data.json", type, url, user, pwd);
		return true;
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
			System.out.println("DBUpgrade() 数据库备份失败!");
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
            //System.out.println("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //System.out.println(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = "CREATE TABLE " + tabName + "(ID INT PRIMARY KEY      NOT NULL)";
            System.out.println("sql:" + sql);
            ret = stmt.execute(sql);
            System.out.println("ret:" + ret);
 
            ret = true;
        }catch(SQLException se){
            // 处理 JDBC 错误
            se.printStackTrace();
        }catch(Exception e){
            // 处理 Class.forName 错误
            e.printStackTrace();
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
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
            //System.out.println("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //System.out.println(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = "DROP TABLE IF EXISTS " + tabName;
            System.out.println("sql:" + sql);
            ret = stmt.execute(sql);
            System.out.println("ret:" + ret);
            ret = true;
        }catch(SQLException se){
            // 处理 JDBC 错误
            se.printStackTrace();
        }catch(Exception e){
            // 处理 Class.forName 错误
            e.printStackTrace();
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
            }
        }
		return ret;
		
	}
	
	protected static boolean exportDatabaseAsSql(List<Integer> exportTabList, String path, String name, String encode, String type, String url, String user, String pwd) 
	{
		System.out.println("backupDB() encode:" + encode + " backup to file:" + path+name);
		
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
		System.out.println("backupDB() End with ret:" + ret);
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
		System.out.println("exportDatabaseAsJson() " + " filePath:" + filePath + " srcVersion:" + srcVersion + " dstVersion:" + dstVersion);

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
				System.out.println("exportDatabaseAsJson() jsonStr is null");
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
		System.out.println("importDatabase() importType:" + importType);
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
	
	private static boolean importDatabaseFromSqlFile(List<Integer> importTabList, String filePath, String fileName,
			String type, String url, String user, String pwd) {
		return executeSqlScript(filePath+fileName, type, url, user, pwd);
	}

	protected static boolean importDatabaseFromJsonFile(List<Integer> importTabList, String filePath, String fileName, String type, String url, String user, String pwd)
	{
		System.out.println("importDatabaseFromJsonFile() filePath:" + filePath + " fileName:" + fileName);

		String s = FileUtil.readDocContentFromFile(filePath, fileName,  "UTF-8");
		JSONObject jobj = JSON.parseObject(s);
		
		for(int i=0; i<importTabList.size(); i++)
		{
			int objType = importTabList.get(i);
			String name = getNameByObjType(objType);
	        JSONArray list = jobj.getJSONArray(name);
	        if(list == null || list.size() == 0)
	        {
	        	System.out.println("importDatabaseFromJsonFile() list is empty for " + name);
	        	continue;
	        }
	
	        importJsonObjListToDataBase(objType, list, type, url, user, pwd);
	    	System.out.println("importObjectListFromJsonFile() import OK");
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
		System.out.println("deleteDBTabs()");

		for(int i=0; i< DBTabNameMap.length; i++)
		{
			deleteDBTab(DBTabNameMap[i], type, url, user, pwd);
		}	
		return true;
	}
	
	//删除数据库表（包括小写的）
	protected static boolean deleteDBTabsEx(String type, String url, String user, String pwd) 
	{
		System.out.println("deleteDBTabs()");

		for(int i=0; i< DBTabNameMap.length; i++)
		{
			deleteDBTab(DBTabNameMap[i].toUpperCase(), type, url, user, pwd);
			deleteDBTab(DBTabNameMap[i].toLowerCase(), type, url, user, pwd); //删除小写的数据库			
		}	
		return true;
	}

	protected static boolean initDB(String type, String url, String user, String pwd) 
	{
		System.out.println("initDB() type:" + type + " url:" + url);
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
		System.out.println("initDBForSqlite() url:" + url);
		return initSqliteTables(type, url, user, pwd);
	}
	
	protected static boolean initDBForMysql(String type, String url, String user, String pwd) 
	{
		System.out.println("initDBForMysql()");
		String sqlScriptPath = docSysWebPath + "WEB-INF/classes/config/docsystem.sql";
		if(FileUtil.isFileExist(sqlScriptPath) == false)
		{
			System.out.println("initDB sqlScriptPath:" + sqlScriptPath + " not exists");
			return false;
		}
		return executeSqlScript(sqlScriptPath, type, url, user, pwd);
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
		}
		else if(oldVersion < 20207)
		{
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_USER);
			dbTabList.add(DOCSYS_REPOS_AUTH);
			dbTabList.add(DOCSYS_DOC_AUTH);			
		}
		else if(oldVersion < 20208)
		{
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_USER);			
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
					System.out.println("initObjMemberListMap() 获取 " + objName +" MemberList失败");
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
		System.out.println("getObjMemberListFromFile() filePath:" + filePath + " fileName:" + fileName + " listName:" + listName);
		String s = FileUtil.readDocContentFromFile(filePath, fileName);
		if(s == null)
		{
			return null;
		}
		
		JSONObject jobj = JSON.parseObject(s);
		JSONArray list = jobj.getJSONArray(listName);
        return list;
	}

	private static String getNameByObjType(int objType) {		
		if(objType < DBTabNameMap.length)
		{
			return DBTabNameMap[objType];
		}
		return null;
	}

	private static Object buildObjectFromJsonObj(JSONObject jsonObj, int objType) {
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
		//System.out.println("createObject() ");
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
		    			e.printStackTrace();
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
		System.out.println("dbQuery() objType:" + objType);
		
		List<Object> list = new ArrayList<Object>();
		
        Connection conn = null;
        Statement stmt = null;
        try{
            // 注册 JDBC 驱动
            Class.forName(JDBC_DRIVER);
        
            // 打开链接
            //System.out.println("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //System.out.println(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = buildQuerySqlForObject(qObj, objType, null);
    		System.out.println("dbQuery() sql:" + sql);

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
            se.printStackTrace();
        }catch(Exception e){
            // 处理 Class.forName 错误
            e.printStackTrace();
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
            }
        }
		return null;
	}


	private static DocAuth correctDocAuth(DocAuth obj) {
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
            //System.out.println("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //System.out.println(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = buildInsertSqlForObject(obj, objType, null);
            //System.out.println("sql:" + sql);
            ret = stmt.execute(sql);
            //System.out.println("ret:" + ret);
            // 完成后关闭
            stmt.close();
            conn.close();
            return ret;
        }catch(SQLException se){
            // 处理 JDBC 错误
            se.printStackTrace();
        }catch(Exception e){
            // 处理 Class.forName 错误
            e.printStackTrace();
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                se.printStackTrace();
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
            //System.out.println("convertJsonObjToObj() type:" + type); 
         	//System.out.println("convertJsonObjToObj() name:" + name); 
         	
 			Object value = getValueFormJsonObj(jsonObj, name, type);
         	//System.out.println("convertJsonObjToObj() value:" + value); 

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
	
	private static Object getValueFormJsonObj(JSONObject jsonObj, String field, String type) {
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
			//System.out.println("getValueFromResultSet() Failed to get value from ResultSet for field:" + field);
			//e.printStackTrace();
		}
		return null;
	}
	
	private static Object convertResultSetToObj(ResultSet rs, Object obj, int objType) 
	{
		//System.out.println("convertResultSetToObj() ");
		
		JSONArray ObjMemberList = getObjMemberList(objType);
		if(ObjMemberList == null)
		{
			System.out.println("convertResultSetToObj() ObjMemberList is null");
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
 			//	System.out.println("convertResultSetToObj() type:" + type + " name:" + name + " value:" + value); 
 			//}
 			//System.out.println("convertResultSetToObj() type:" + type); 
         	//System.out.println("convertResultSetToObj() name:" + name); 
         	
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
				e.printStackTrace();
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
				//System.out.println("enocdeString() tmpSqlValue:" + tmpStr);
				return tmpStr;
			} catch (Exception e) {
				e.printStackTrace();
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
			System.out.println("restartTomcat() Failed to get serverPath");
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
			System.out.println("upgradeSystem() Failed to get serverPath");
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
			System.out.println("restartTomcat() generateTomcatStopScript failed");
			return false;
		}
    	String startScriptPath = generateTomcatStartScript(tomcatPath, javaHome);
    	if(startScriptPath == null)
		{
			System.out.println("restartTomcat() generateTomcatStartScript failed");
			return false;
		}
		
    	System.out.println("restartTomcat() stopScriptPath:" + stopScriptPath);
    	System.out.println("restartTomcat() startScriptPath:" + startScriptPath);
    	
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
		System.out.println("generateTomcatStopScript() FileUtil.saveDocContentToFile failed");
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
		System.out.println("generateTomcatStartScript() FileUtil.saveDocContentToFile failed");
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
        		System.out.println("执行成功！");
        	}
        	else
        	{
        		System.out.println("执行失败:" + exitCode);   
        		System.out.println("错误日志:" + result);   
            		
        	}
        	ps.destroy();
            
        } catch (Exception e) {
            e.printStackTrace();
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
        		System.out.println("执行成功！");
        		ret = true;
        	}
        	else
        	{
        		System.out.println("执行失败:" + exitCode);   
        		System.out.println("错误日志:" + result);   
            		
        	}
        	ps.destroy();
        	runResult.exitCode = exitCode;
        	runResult.result = result;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ret;
    }
    

	private static String readProcessOutput(Process ps) throws IOException {
		// TODO Auto-generated method stub
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
	protected Integer getMaxFileSize() {
		// TODO Auto-generated method stub
		return null;
	}
	
	//获取当前登录用户信息
	protected User getCurrentUser(HttpSession session){
		User user = (User) session.getAttribute("login_user");
		System.out.println("get sessionId:"+session.getId());
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
			System.out.println("获取emailConfig.properties失败");
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
    	System.out.println("testUrl() URL:" + urlString);
        boolean ret = false;
        long lo = System.currentTimeMillis();
        URL url = null;  
        try {  
             url = new URL(urlString);  
             InputStream in = url.openStream();
             in.close();
             ret = true;
             System.out.println("连接可用");  
        } catch (Exception e) {
        	e.printStackTrace();
            System.out.println("连接打不开!");
        } 
        System.out.println("testUrl() used time:" + (System.currentTimeMillis()-lo) + " ms");
        return ret;
    }
    
    public static boolean testUrlWithTimeOut(String urlString,int timeOutMillSeconds){
    	System.out.println("testUrlWithTimeOut() URL:" + urlString);
    	boolean ret = false;
    	long lo = System.currentTimeMillis();
        URL url = null;
        try {  
             url = new URL(urlString);  
             URLConnection co =  url.openConnection();
             co.setConnectTimeout(timeOutMillSeconds);
             co.connect();
             ret = true;
             System.out.println("连接可用");  
        } catch (Exception e) {
        	e.printStackTrace();
            System.out.println("连接打不开!");  
        }  
        System.out.println("testUrlWithTimeOut() used time:" + (System.currentTimeMillis()-lo) + " ms");
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
       System.out.println(counts +"= "+state);  
       if (state == 200) {  
        System.out.println("URL可用！");  
       }  
       break;  
      }catch (Exception ex) {  
       counts++;   
       System.out.println("URL不可用，连接第 "+counts+" 次");  
       urlStr = null;  
       continue;  
      }  
     }  
     return url;  
  }

	public Repos getRepos(Integer reposId) {
		return reposService.getRepos(reposId);
	}  
	
	
	//注意：该接口需要返回真正的parentZipDoc
	protected Doc checkAndExtractEntryFromCompressDoc(Repos repos, Doc rootDoc, Doc doc) 
	{
		System.out.println("checkAndExtractEntryFromCompressDoc() rootDoc:" + rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName());
		System.out.println("checkAndExtractEntryFromCompressDoc() doc:" + doc.getLocalRootPath() + doc.getPath() + doc.getName());
		Doc parentCompressDoc = getParentCompressDoc(repos, rootDoc, doc);
		if(parentCompressDoc.getDocId().equals(rootDoc.getDocId()))
		{	
			//如果doc的parentCompressDoc是rootDoc，那么直接从rootDoc解压出doc
			System.out.println("checkAndExtractEntryFromCompressDoc() parentCompressDoc:" + parentCompressDoc.getPath() + parentCompressDoc.getName() + " is rootDoc");
			parentCompressDoc = rootDoc;
		}
		else
		{
			//如果doc的parentCompressDoc不存在，那么有两种可能：没有被解压出来，或者是目录（但尾缀是压缩文件尾缀）
			File parentFile = new File(parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
			if(parentFile.exists() == false)
			{
				//此时无法区分该parentCompressDoc是否是目录，只能将其解压出来，然后让extractEntryFromCompressFile来找到真正的parentCompressDoc
				checkAndExtractEntryFromCompressDoc(repos, rootDoc, parentCompressDoc);				
			}
			else if(parentFile.isDirectory())
			{
				//表明parentCompressDoc是目录，因此需要继续向上找到真正的parentCompressDoc
				parentCompressDoc = checkAndExtractEntryFromCompressDoc(repos, rootDoc, parentCompressDoc);
			}
		}
		
		//解压zipDoc (parentCompressDoc必须已存在，无论是目录还是文件，如果是目录的话则继续向上查找，但此时肯定都存在)
		extractEntryFromCompressFile(repos, rootDoc, parentCompressDoc, doc);
		return parentCompressDoc;
	}
	
	private boolean extractEntryFromCompressFile(Repos repos, Doc rootDoc, Doc parentCompressDoc, Doc doc) 
	{
		parentCompressDoc = checkAndGetRealParentCompressDoc(repos, rootDoc, parentCompressDoc);
		if(parentCompressDoc == null)
		{
			System.out.println("extractEntryFromCompressFile() " + parentCompressDoc + " is null");
			return false;
		}
		
		String compressFileType = FileUtil.getCompressFileType(parentCompressDoc.getName());
		if(compressFileType == null)
		{
			System.out.println("extractEntryFromCompressFile() " + rootDoc.getName() + " 不是压缩文件！");
			return false;
		}
		
		switch(compressFileType)
		{
		case "zip":
		case "war":
			return extractEntryFromZipFile(parentCompressDoc, doc);
		case "rar":
			return extractEntryFromCompressFile(parentCompressDoc, doc);			
		case "7z":
			return extractEntryFrom7zFile(parentCompressDoc, doc);			
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
			System.out.println("extractEntryFromCompressFile() parentCompressDoc 不存在！");
			Log.printObject("extractEntryFromCompressFile() parentCompressDoc:",parentCompressDoc);
			return null;
		}
		
		if(parentFile.isDirectory())
		{
			System.out.println("extractEntryFromCompressFile() parentCompressDoc 是目录，向上层查找realParentCompressDoc！");
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
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
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
            e.printStackTrace();
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
                e.printStackTrace();
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
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
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
            e.printStackTrace();
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
                e.printStackTrace();
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
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
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
            e.printStackTrace();
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
                e.printStackTrace();
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
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
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
	            	System.out.println("subEntry:" + entry.getName());
	            	
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
            e.printStackTrace();
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
                e.printStackTrace();
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
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
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
	            	System.out.println("subEntry:" + entry.getName());
	                
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
            e.printStackTrace();
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
                e.printStackTrace();
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
			System.out.println("extractEntryFromTgzFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTgzFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(doc.getPath(), parentCompressDoc.getPath() + parentCompressDoc.getName() + "/");
        String expEntryPath = "./" + relativePath + doc.getName();
    	System.out.println("extractEntryFromTgzFile expEntryPath:" + expEntryPath);
        
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
            	//System.out.println("extractEntryFromTgzFile subEntry:" + subEntryPath);
            	if(subEntryPath.equals(expEntryPath) || subEntryPath.equals(expEntryPath.substring(2)))
            	{	  
            		System.out.println("extractEntryFromTgzFile subEntry:" + subEntryPath);
            		System.out.println("extractEntryFromTgzFile subEntry:" + doc.getLocalRootPath() + doc.getPath() + doc.getName());
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
            e.printStackTrace();
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
                e.printStackTrace();
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
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
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
            		System.out.println("subEntry:" + entry.getName());
	                
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
           e.printStackTrace();
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
                e.printStackTrace();
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
			System.out.println("extractEntryFrom7zFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFrom7zFile " + parentZipFilePath + " 是目录！");
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
            	System.out.println("subEntry:" + subEntryPath);
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
            e.printStackTrace();
        }finally {
            try {
                if(sevenZFile != null){
                    sevenZFile.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
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
			System.out.println("extractEntryFromCompressFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromCompressFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
	    String expEntryPath = relativePath + zipDoc.getName();
	    if(isWinOS())
	    {
	    	expEntryPath = expEntryPath.replace("/", "\\");
	    }
    	System.out.println("extractEntryFromCompressFile expEntryPath:" + expEntryPath);
        
        RandomAccessFile randomAccessFile = null;
        IInArchive inArchive = null;
        try {
            randomAccessFile = new RandomAccessFile(parentZipFilePath, "r");
            inArchive = SevenZip.openInArchive(null, // autodetect archive type
                    new RandomAccessFileInStream(randomAccessFile));

        	int[] in = new int[inArchive.getNumberOfItems()];
	        for (int i = 0; i < inArchive.getNumberOfItems(); i++) {
            	String subEntryPath = (String) inArchive.getProperty(i, PropID.PATH);
            	System.out.println("extractEntryFromCompressFile subEntryPath:" + subEntryPath);
            	if(subEntryPath.equals(expEntryPath))
            	{
                	System.out.println("extractEntryFromCompressFile expEntry found:" + subEntryPath);
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
    				    System.out.println("extractEntryFromCompressFile outDir:" + outputDir);
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
	
	private boolean extractEntryFromRarFile(Doc parentZipDoc, Doc zipDoc) {
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			System.out.println("extractEntryFromRarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			System.out.println("extractEntryFromRarFile " + parentZipFilePath + " 是目录！");
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
                	System.out.println("subEntry:" + subEntryPath);
                	
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
            e.printStackTrace();
        }finally {
            try {
                if(archive != null){
                    archive.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
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
				System.out.println("extractZipFile() " + relativePath + zipDoc.getName() + " not exists in zipFile:" + parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName());
				return false;
			}
			
			//注意即使是目录也要生成目录，因为该目录将是用来区分名字压缩尾缀的目录和真正的压缩文件
			if(entry.isDirectory())
			{
				System.out.println("extractZipFile() " + relativePath + zipDoc.getName() + " is Directory in zipFile:" + parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName());
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
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if(parentZipFile != null)
			{
				try {
					parentZipFile.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
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
	      ioe.printStackTrace(); 
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
	         e.printStackTrace(); 
	       } 
	    } 
	    return ret;
	} 

	//获取doc的parentZipDoc(这里有风险parentZipDoc里面的目录的名字带压缩后缀)
	private Doc getParentCompressDoc(Repos repos, Doc rootDoc, Doc doc) {
		
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
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if(fileOutputStream != null)
			{
				try {
					fileOutputStream.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
			if(inputStream != null)
			{
				try {
					inputStream.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
		return ret;
	}
	
	protected boolean isOfficeEditorApiConfiged(HttpServletRequest request) {
		System.out.println("FileUtil.isOfficeEditorApiConfiged() officeEditorApi:" + officeEditorApi);
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
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		if(downloadDoc == null)
		{
			System.out.println("buildSaveDocLink() buildDownloadDocInfo failed");
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
	
	protected String buildDownloadDocLink(Doc doc, String authCode, String urlStyle, ReturnAjax rt) {
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		if(downloadDoc == null)
		{
			System.out.println("buildDownloadDocLink() buildDownloadDocInfo failed");
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
			fileLink = "/DocSystem/Doc/downloadDoc/" + doc.getVid() + "/" + downloadDoc.getPath() + "/" + downloadDoc.getName() +  "/" + downloadDoc.targetPath +  "/" + downloadDoc.targetName +"/" + authCode + "/" + shareId;
		}
		else
		{
			fileLink = "/DocSystem/Doc/downloadDoc.do?vid=" + doc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName;	
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
	
	
	protected String buildOfficeEditorKey(Doc doc) {
		return (doc.getLocalRootPath() + doc.getDocId() + "_" + doc.getSize() + "_" + doc.getLatestEditTime()).hashCode() + "";
	}
	
	protected HashMap<String, String> buildQueryParamForObj(User obj, Integer pageIndex, Integer pageSize) {
		HashMap<String, String> param = new HashMap<String,String>();
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
					// TODO Auto-generated catch block
					e.printStackTrace();
				} catch (IllegalAccessException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
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
        
        System.out.println("getRequestBodyAsJSONObject body:" + body);        
        JSONObject jsonObj = JSON.parseObject(body);
        return jsonObj;
	}
	
	protected JSONObject getDocTextSearch(Repos repos, Doc doc) {
		String reposTextSearchConfigPath = Path.getReposTextSearchConfigPath(repos);
		String disableRealDocTextSearchFileName = doc.getDocId() + ".disableRealDocTextSearch";
		String disableVirtualDocTextSearchFileName = doc.getDocId() + ".disableVirtualDocTextSearch";
		
		JSONObject textSearchSetting = new JSONObject();
		
		//全文搜索
		File realDocTextSearchDisableFile = new File(reposTextSearchConfigPath + disableRealDocTextSearchFileName);
		if(realDocTextSearchDisableFile.exists())
		{
			textSearchSetting.put("disableRealDocTextSearch", 1);
		}
		else
		{
			textSearchSetting.put("disableRealDocTextSearch", 0);			
		}
		
		//备注全文搜索
		File virtualDocTextSearchDisableFile = new File(reposTextSearchConfigPath + disableVirtualDocTextSearchFileName);
		if(virtualDocTextSearchDisableFile.exists())
		{
			textSearchSetting.put("disableVirtualDocTextSearch", 1);
		}
		else
		{
			textSearchSetting.put("disableVirtualDocTextSearch", 0);			
		}
		return textSearchSetting;
	}
	
	protected boolean setDocTextSearch(Repos repos, Doc doc, Integer disableRealDocTextSearch,
			Integer disableVirtualDocTextSearch) {
		
		String reposTextSearchConfigPath = Path.getReposTextSearchConfigPath(repos);
		String disableRealDocTextSearchFileName = doc.getDocId() + ".disableRealDocTextSearch";
		String disableVirtualDocTextSearchFileName = doc.getDocId() + ".disableVirtualDocTextSearch";
		
		//全文搜索
		if(disableRealDocTextSearch == null || disableRealDocTextSearch == 0)
		{
			FileUtil.delFile(reposTextSearchConfigPath + disableRealDocTextSearchFileName);
		}
		else
		{
			FileUtil.saveDocContentToFile("disable", reposTextSearchConfigPath, disableRealDocTextSearchFileName, "UTF-8");
		}
		
		//备注全文搜索
		if(disableVirtualDocTextSearch == null || disableVirtualDocTextSearch == 0)
		{
			FileUtil.delFile(reposTextSearchConfigPath + disableVirtualDocTextSearchFileName);
		}
		else
		{
			FileUtil.saveDocContentToFile("disable", reposTextSearchConfigPath, disableVirtualDocTextSearchFileName, "UTF-8");
		}
		return true;
	}
}
