package com.DocSystem.common;

import java.io.File;
import java.util.Date;

import org.springframework.web.context.ContextLoader;
import org.springframework.web.context.WebApplicationContext;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

import util.ReadProperties;
import util.Encrypt.MD5;

public class Path {	
	public static String getDocSysWebParentPath(String localPath) {
		int pos = localPath.indexOf("/DocSystem");
		return localPath.substring(0, pos+1);
	}
	
	//path必须是标准格式
	public static int getLevelByParentPath(String path) 
	{
		if(path == null || path.isEmpty())
		{
			return 0;
		}
		
		String [] paths = path.split("/");
		return paths.length;
	}

	public static int seperatePathAndName(String entryPath, String [] result) {
		if(entryPath.isEmpty())
		{
			//It it rootDoc
			return -1;
		}
		
		String [] paths = entryPath.split("/");
		
		int deepth = paths.length;
		//Log.debug("seperatePathAndName() deepth:" + deepth); 
		
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
	
	//正确格式化仓库根路径
	public static String dirPathFormat(String path) {
		//如果传入的Path没有带/,给他加一个
		if(path == null || path.isEmpty())
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
	public static String localDirPathFormat(String path, Integer OSType) {
		if(path == null || path.isEmpty())
		{
			path = "/";
		}
		else
		{
			path = path.replace('\\','/');
		}
		
		String [] paths = path.split("/");
		
		char startChar = path.charAt(0);
		if(startChar == '/')	
		{
			if(OS.isWinOS(OSType))
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
			if(OS.isWinOS(OSType))
			{
				if(OS.isWinDiskStr(paths[0]))
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
				if(OS.isWinDiskStr(paths[0]))
				{
					paths[0] = "";	//去掉盘符信息
				}
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
	public static String getSystemLogParentPath(String docSysWebPath) {
		if(docSysWebPath == null || docSysWebPath.isEmpty())
		{
			return null;
		}
		int pos = docSysWebPath.indexOf("/tomcat");
		if(pos <= 0)
		{
			//return docSysWebPath + "../../../logs/";	//默认放在/docsys/logs目录
			return null;
		}
		
		return docSysWebPath.substring(0, pos) + "/logs/";
	}
	
	
	public static String getReposTmpPathForDoc(Repos repos, Doc doc) {
		String tmpDir = repos.getPath() + repos.getId() +  "/tmp/doc/" +  doc.getDocId() + "_" + doc.getName() + "/";
		FileUtil.createDir(tmpDir);
		return tmpDir;
	}
	
	public static String getReposTmpPathForPreview(Repos repos, Doc doc) {
		String docLocalPath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/preview/" +  docLocalPath.hashCode() + "_" + doc.getName() + "/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}
	
	public static String getReposTmpPathForTextEdit(Repos repos, User login_user, boolean isRealDoc) {
		if(isRealDoc)
		{
			String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/TextEdit/" + login_user.getId() + "/RDOC/";
			FileUtil.createDir(userTmpDir);
		}
		
		//VDoc
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/TextEdit/" + login_user.getId() + "/VDOC/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}
	
	public static String getReposTmpPathForDownload(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/download/" + login_user.getId() + "/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}
	
	public static String getReposTmpPathForDownload(Repos repos) {
		long curTime = new Date().getTime();
		String tmpDir = repos.getPath() + repos.getId() +  "/tmp/download/" + curTime + "/";
		FileUtil.createDir(tmpDir);
		return tmpDir;
	}
	
	public static String getReposTmpPathForUpload(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/upload/" + login_user.getId() + "/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}
	
	//加解密临时目录，用完删除
	public static String getReposTmpPathForDecrypt(Repos repos) {
		long curTime = new Date().getTime();
		String tmpDir = repos.getPath() + repos.getId() +  "/tmp/encrypt/" + curTime + "/";
		FileUtil.createDir(tmpDir);
		return tmpDir;
	}
	
	//加解密临时目录，用完不删除
	public static String getReposTmpPathForZipDecrypt(Repos repos, Doc doc) {
		String tmpDir = repos.getPath() + repos.getId() +  "/tmp/zipDecrypt/" + doc.getDocId() + "_" + doc.getName() + "/";
		FileUtil.createDir(tmpDir);
		return tmpDir;
	}
	
	//根据路径来获取上层路径 
	protected static String getParentPath(String path) {
		if(path == null || path.length() < 2)
		{
			Log.debug("getParentPath() failed to get parentPath for path:" + path);
			return null;
		}
		
		//反向查找 "/"
		int pos = path.lastIndexOf("/", path.length() - 2);
		if(pos == -1)
		{
			Log.debug("getParentPath() failed to get parentPath for path:" + path);
			return null;
		}
		String parentPath = path.substring(0, pos+1);
        Log.debug("getParentPath() parentPath:" + parentPath);
		return parentPath;
	}
	
	public static String getParentPath(String path, int n, Integer OSType) {
		path = localDirPathFormat(path, OSType); //首先对路径进行统一格式化
		
		for(int i=0; i<n; i++)
		{
			path = getParentPath(path);
		}
		
		return path;
	}
	
	//WebPath was 
	public static String getWebPath(Integer OSType) {
		String webPath = null;
		try {
	        WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
	        webPath =  wac.getServletContext().getRealPath("/");
		} 
		catch (Exception e)
		{
			Log.info("getWebPath() 异常，系统出现严重错误,请检查系统!!");
			Log.info(e);
		}
        webPath = localDirPathFormat(webPath, OSType);
        Log.debug("getWebPath() webPath:" + webPath);
		return webPath;
	}
	
	//获取本地仓库默认存储位置（相对于仓库的存储路径）
	public static String getDefaultLocalVerReposPath(String path) {
		String localSvnPath = path + "DocSysVerReposes/";
		return localSvnPath;
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
	
	//获取默认的仓库根路径
	public static String getDefaultReposRootPath(Integer OSType) {
		String path = ReadProperties.read("docSysConfig.properties", "defaultReposStorePath");
		if(OS.isWinOS(OSType))
		{
			if(path == null || path.isEmpty())
			{
				path = "C:/DocSysReposes/";
			}
			else
			{
				path = localDirPathFormat(path, OSType);
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
				path = localDirPathFormat(path, OSType);
			}
		}	    
		return path;
	}
	
	public static String getSaleDataStorePath(Integer OSType) {
    	String path = null;
    	path = ReadProperties.read("docSysConfig.properties", "SalesDataStorePath");
        if(path != null && !path.isEmpty())
        {
        	return Path.localDirPathFormat(path, OSType);
        }

        switch(OSType)
        {
        case OS.Windows:
        	path = "C:/DocSysSales/";
        	break;
        case OS.Linux: 
        	path = "/data/DocSysSales/";
        	break;
        case OS.MacOS:
        	path = "/data/DocSysSales/";
        	break;
        }
        return path;
    }	
	
	public static String getSystemLogStorePath(Integer OSType) {
    	String path = null;
    	path = ReadProperties.read("docSysConfig.properties", "SystemLogStorePath");
        if(path != null && !path.isEmpty())
        {
        	return Path.localDirPathFormat(path, OSType);
        }

        switch(OSType)
        {
        case OS.Windows:
        	path = "C:/DocSysLog/SystemLog/";
        	break;
        case OS.Linux: 
        	path = "/data/DocSysLog/SystemLog/";
        	break;
        case OS.MacOS:
        	path = "/data/DocSysLog/SystemLog/";
        	break;
        }
        return path;
    }	
	
	public static String getReposPath(Repos repos) {
		String path = repos.getPath();
		return path + repos.getId() + "/";
	}

	//获取仓库的实文件的本地存储根路径
	public static String getReposRealPath(Repos repos)
	{
		String reposRPath =  repos.getRealDocPath();
		if(reposRPath == null || reposRPath.isEmpty())
		{
			reposRPath = getReposPath(repos) + "data/rdata/";	//实文件系统的存储数据放在data目录下 
		}
		//Log.debug("getReposRealPath() " + reposRPath);
		return reposRPath;
	}
	
	//获取仓库的虚拟文件的本地存储根路径
	public static String getReposVirtualPath(Repos repos)
	{
		String reposVPath = getReposPath(repos) + "data/vdata/";	//实文件系统的存储数据放在data目录下 
		//Log.debug("getReposVirtualPath() " + reposVPath);
		return reposVPath;
	}
	
	//获取仓库的密码文件的存储路径
	public static String getReposPwdPath(Repos repos)
	{
		String reposPwdPath = getReposPath(repos) + "data/pwd/";	//实文件系统的存储数据放在data目录下 
		//Log.debug("getReposPwdPath() " + reposPwdPath);
		return reposPwdPath;
	}
	
	//仓库文件缓存根目录
	public static String getReposTmpPath(Repos repos) {
		String tmpDir = repos.getPath() + repos.getId() +  "/tmp/";
		return tmpDir;
	}
	
	
	//历史文件缓存目录，需要区分RDoc和VDoc
	public static String getReposTmpPathForHistory(Repos repos, String commitId, boolean isRealDoc) {
		if(isRealDoc)
		{	
			String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/History/rdata/" + commitId + "/";
			FileUtil.createDir(userTmpDir);
			return userTmpDir;
		}
		
		//is VDoc
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/History/vdata/" + commitId + "/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}
	
	//压缩文件解压缓存目录
	public static String getReposTmpPathForUnzip(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/Unzip/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}
	
	//用户的仓库临时目录
	public static String getReposTmpPathForUser(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/User/" + login_user.getId() + "/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}

	public static String getReposTmpPathForOfficeText(Repos repos, Doc doc) {
		String docLocalPath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/OfficeText/" + docLocalPath.hashCode() + "_" + doc.getName() + "/";
		FileUtil.createDir(userTmpDir);
		return userTmpDir;
	}
	
	
	//获取OfficeEditorApi的配置
	public static String getOfficeEditorApi() {
		String officeEditorApi = ReadProperties.read("docSysConfig.properties", "officeEditorApi");
		if(officeEditorApi != null && !officeEditorApi.isEmpty())
		{
			return officeEditorApi.replace("\\", "/");
		}
		return officeEditorApi;
	}
	
	public static Integer getLogLevel() {
		String logLevelString = ReadProperties.read("docSysConfig.properties", "logLevel");
		if(logLevelString != null && !logLevelString.isEmpty())
		{
			return Integer.getInteger(logLevelString);
		}
		return null;
	}
	
	//系统日志的名字，可以是目录或文件
	public static String getSystemLogFileName() {
		String name = "";
		
		name = ReadProperties.read("docSysConfig.properties", "SystemLogFileName");
	    if(name == null || "".equals(name))
	    {
			name = "catalina.log";
	    }	    
		return name;
	}
	
	public static String getVDocName(Doc doc) 
	{
		return doc.getDocId() + "_" + doc.getName();
	}
	
	protected static String getHashId(String path) 
	{
		String hashId = MD5.md5(path);
		Log.debug("getHashId() " + hashId + " for " + path);
		return hashId;
	}

	public static String getOfficeTextFileName(Doc doc) {
		File file = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
		return "officeText_" + file.length() + "_" + file.lastModified() + ".txt";
	}
	
	public static String getPreviewFileName(Doc doc) {
		File file = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
		return "preview_" + file.length() + "_" + file.lastModified() + ".pdf";
	}
	
	public static String getLocalVerReposURI(Repos repos, boolean isRealDoc) {
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
	
	public static String getLocalVerReposPath(Repos repos, boolean isRealDoc) {
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

		if(localSvnPath == null || localSvnPath.isEmpty())
		{
			localSvnPath = repos.getPath() + "DocSysVerReposes/";
		}
		
		localSvnPath = dirPathFormat(localSvnPath);
		String reposName = getVerReposName(repos,isRealDoc);
		
		localVerReposPath = localSvnPath + reposName + "/";
		return localVerReposPath;
	}

	public static String getVerReposName(Repos repos,boolean isRealDoc) {
		String reposName = null;
		if(isRealDoc)
		{
			reposName = getVerReposName(repos.getId(), repos.getVerCtrl(), repos.getIsRemote(), isRealDoc);
		}
		else
		{
			reposName = getVerReposName(repos.getId(), repos.getVerCtrl1(), repos.getIsRemote(), isRealDoc);
		}
		return reposName;
	}
	
	public static String getVerReposName(Integer reposId, Integer verCtrl, Integer isRemote, boolean isRealDoc) {
		String reposName = null;
		
		Integer id = reposId;
		if(isRealDoc)
		{
			if(verCtrl == 1)
			{
				reposName = id + "_SVN_RRepos";
			}
			else if(verCtrl == 2)
			{ 
				if(isRemote !=null && isRemote == 1)
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
			if(verCtrl == 1)
			{
				reposName = id + "_SVN_VRepos";
			}
			else if(verCtrl == 2)
			{
				if(isRemote != null && isRemote == 1)
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
	public static Long buildDocIdByName(Integer level, String parentPath, String docName) 
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
	
	public static String getReposEncryptConfigPath(Repos repos) {
		String path = getReposPath(repos) + "data/encryptSetting/";
		return path;
	}
	
	public static String getReposEncryptConfigFileName() {
		return "encryptConfig.txt";
	}

	public static String getReposTextSearchConfigPath(Repos repos) {
		String path = getReposPath(repos) + "data/textSearchSetting/";
		return path;
	}
	
	public static String getReposTextSearchConfigPathForRealDoc(Repos repos) {
		String path = getReposPath(repos) + "data/textSearchSetting/RealDoc/";
		return path;
	}

	public static String getReposTextSearchConfigPathForVirtualDoc(Repos repos) {
		String path = getReposPath(repos) + "data/textSearchSetting/VirtualDoc/";
		return path;
	}
	
	public static String getReposRemoteServerConfigPath(Repos repos) {
		String path = getReposPath(repos) + "data/remoteServerSetting/";
		return path;
	}
	
	public static String getReposAutoBackupConfigPath(Repos repos) {
		String path = getReposPath(repos) + "data/autoBackupSetting/";
		return path;
	}
	
	protected String getOfficeEditRootPath(Doc doc) {
		String path = doc.getReposPath() + "tmp/OfficeEdit/";
		return path;
	}
	
	public static String getOfficeEditPath(String dockey, Doc doc) {
		String path = doc.getReposPath() + "tmp/OfficeEdit/" + dockey + "/";
		return path;
	}

	public static String getOrgChangesPath(String dockey, Doc doc) {
		String path = getOfficeEditPath(dockey, doc) + "orgChanges/";
		return path;
	}

	public static String getChangesPath(String dockey, Doc doc) {
		String path = getOfficeEditPath(dockey, doc) + "data/changes/";
		return path;
	}
	
	public static String getIndexLibPathForChanges(String dockey,  Doc doc) {
		String path = getOfficeEditPath(dockey, doc) + "changesIndex/";
		return path;
	}
	
	public String getLocalPathForSave(String dockey, Doc doc) {
		String path = getOfficeEditPath(dockey, doc) + "save/";
		return path;
	}
}
