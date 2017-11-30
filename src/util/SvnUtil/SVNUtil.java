package util.SvnUtil;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Collection;
import java.util.Iterator;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;


import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.RequestMapping;
import org.tmatesoft.svn.core.SVNCommitInfo;
import org.tmatesoft.svn.core.SVNDepth;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNErrorCode;
import org.tmatesoft.svn.core.SVNErrorMessage;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNLogEntry;
import org.tmatesoft.svn.core.SVNLogEntryPath;
import org.tmatesoft.svn.core.SVNNodeKind;
import org.tmatesoft.svn.core.SVNProperties;
import org.tmatesoft.svn.core.SVNProperty;
import org.tmatesoft.svn.core.SVNPropertyValue;
import org.tmatesoft.svn.core.SVNURL;
import org.tmatesoft.svn.core.auth.ISVNAuthenticationManager;
import org.tmatesoft.svn.core.internal.io.dav.DAVRepositoryFactory;
import org.tmatesoft.svn.core.internal.io.fs.FSRepositoryFactory;
import org.tmatesoft.svn.core.internal.io.svn.SVNRepositoryFactoryImpl;
import org.tmatesoft.svn.core.internal.util.SVNPathUtil;
import org.tmatesoft.svn.core.internal.wc.DefaultSVNOptions;
import org.tmatesoft.svn.core.io.ISVNEditor;
import org.tmatesoft.svn.core.io.ISVNReporter;
import org.tmatesoft.svn.core.io.ISVNReporterBaton;
import org.tmatesoft.svn.core.io.SVNRepository;
import org.tmatesoft.svn.core.io.SVNRepositoryFactory;
import org.tmatesoft.svn.core.io.diff.SVNDeltaGenerator;
import org.tmatesoft.svn.core.io.diff.SVNDeltaProcessor;
import org.tmatesoft.svn.core.io.diff.SVNDiffWindow;
import org.tmatesoft.svn.core.wc.ISVNEventHandler;
import org.tmatesoft.svn.core.wc.ISVNOptions;
import org.tmatesoft.svn.core.wc.SVNClientManager;
import org.tmatesoft.svn.core.wc.SVNCommitClient;
import org.tmatesoft.svn.core.wc.SVNCopySource;
import org.tmatesoft.svn.core.wc.SVNRevision;
import org.tmatesoft.svn.core.wc.SVNStatus;
import org.tmatesoft.svn.core.wc.SVNUpdateClient;
import org.tmatesoft.svn.core.wc.SVNWCUtil;


public class SVNUtil {
	
	//For Low Level APIs
	private SVNRepository repository;

	//For High Level APIs
    private  SVNClientManager ourClientManager;
    private  ISVNEventHandler myCommitEventHandler;
    private  ISVNEventHandler myUpdateEventHandler;
    private  ISVNEventHandler myWCEventHandler;
    private  ConflictResolverHandler myCommitConflictResolverHandler;
	private SVNURL repositoryURL = null;

	/***
     * SVNUtil初始化方法：需要指定此次操作的SVN路径、用户名和密码
     * @param reposURL
     * @param userName
     * @param password
     */
    public boolean Init(String reposURL, String name, String password) {
    	//根据不同协议，初始化不同的仓库工厂。(工厂实现基于SVNRepositoryFactory抽象类)
        setupLibrary();
           	
        //转换 url From String to SVNURL
        try {
        	repositoryURL = SVNURL.parseURIEncoded(reposURL);
        } catch (SVNException e) {
            e.printStackTrace();
            return false;
        }

        //It is for low level API calls，注意后面的High Level接口实际上也会创建一个仓库驱动
        //创建一个仓库驱动并设置权限验证对象
        try {
			repository = SVNRepositoryFactory.create(repositoryURL);
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
        //设置权限验证对象
        ISVNAuthenticationManager authManager = SVNWCUtil.createDefaultAuthenticationManager(name, password);
        repository.setAuthenticationManager(authManager);
        
        
        //以下所有变量初始化都是为调用HighLevel API准备的
        /*
         * Creating custom handlers that will process events
         */
        myCommitEventHandler = new CommitEventHandler();
        
        myUpdateEventHandler = new UpdateEventHandler();
        
        myWCEventHandler = new WCEventHandler();
        
        myCommitConflictResolverHandler = new ConflictResolverHandler();
        
        /*
         * Creates a default run-time configuration options driver. Default options 
         * created in this way use the Subversion run-time configuration area (for 
         * instance, on a Windows platform it can be found in the '%APPDATA%\Subversion' 
         * directory). 
         * 
         * readonly = true - not to save  any configuration changes that can be done 
         * during the program run to a config file (config settings will only 
         * be read to initialize; to enable changes the readonly flag should be set
         * to false).
         * 
         * SVNWCUtil is a utility class that creates a default options driver.
         */
        ISVNOptions options = SVNWCUtil.createDefaultOptions(true);
       
        /*
         * Creates an instance of SVNClientManager providing authentication
         * information (name, password) and an options driver
         */
        ourClientManager = SVNClientManager.newInstance((DefaultSVNOptions) options, name, password);
        
        /*
         * Sets a custom event handler for operations of an SVNCommitClient 
         * instance
         */
        ourClientManager.getCommitClient().setEventHandler(myCommitEventHandler);
        //设置commit conflict handler
        SVNCommitClient  CommitClient = ourClientManager.getCommitClient();
        DefaultSVNOptions commit_options = (DefaultSVNOptions) CommitClient.getOptions();
        commit_options.setConflictHandler(myCommitConflictResolverHandler);
        
        /*
         * Sets a custom event handler for operations of an SVNUpdateClient 
         * instance
         */
        ourClientManager.getUpdateClient().setEventHandler(myUpdateEventHandler);

        /*
         * Sets a custom event handler for operations of an SVNWCClient 
         * instance
         */
        ourClientManager.getWCClient().setEventHandler(myWCEventHandler);
        
        return true;
    }
    
    /*************** Rainy Added Interfaces Based on Low Level APIs Start **************/
    //FSFS格式SVN仓库创建接口
	public static String CreateRepos(String name,String path){
		System.out.println("CreateRepos reposName:" + name + "under Path:" + path);
		
		SVNURL tgtURL = null;
		//create svn repository
		try {  			   
				String reposPath = path + name;
				tgtURL = SVNRepositoryFactory.createLocalRepository( new File( reposPath ), true ,false );  
				System.out.println("tgtURL:" + tgtURL.toString());			   
		} catch ( SVNException e ) {  
				//处理异常  
				e.printStackTrace();
				System.out.println("创建svn仓库失败");
				return null;			   
		}
		//return tgtURL.toString();	//直接将tatURL转成String会导致中文乱码
		return "file:///"+path+name; 
	}
	
	//检查仓库指定revision的节点是否存在
	public boolean doCheckPath(String remoteFilePath,long revision) throws SVNException
	{
		SVNNodeKind	nodeKind = repository.checkPath(remoteFilePath, revision);
		
		if(nodeKind == SVNNodeKind.NONE) 
		{
			return false;
		}
		return true;
	}
	
	//将远程目录同步成本地目录的结构：
	//1、遍历远程目录：将远程多出来的文件和目录删除
	//2、遍历本地目录：将本地多出来的文件或目录添加到远程
	public boolean doSyncUpWithLocal(String myWorkingCopyPath) throws SVNException {

		File wcDir = new File(myWorkingCopyPath);
		if(!wcDir.exists())
		{
			System.out.println(myWorkingCopyPath + "不存在");
		}
		
		SVNNodeKind nodeKind = repository.checkPath("", -1);
        if (nodeKind == SVNNodeKind.NONE) {
        	System.out.println("仓库不存在");
            return false;
        } else if (nodeKind == SVNNodeKind.FILE) {
        	System.out.println("仓库根目录是文件");
            return false;
        }
        
    	System.out.println("doSyncUpForDelete Start");
        try {
        	doSyncUpForDelete(myWorkingCopyPath,"");
        } catch (SVNException svne) {
            error("error while doSyncUpForDelete '" + myWorkingCopyPath + "'", svne);
            return false;
        }
        
    	System.out.println("doSyncUpForAdd Start");
        try {
        	doSyncUpForAdd(myWorkingCopyPath,"");
        } catch (SVNException svne) {
            error("error while doSyncUpForAdd '" + myWorkingCopyPath + "'", svne);
            return false;
        }

        return true;
	}
    
    public void doSyncUpForDelete(String myWorkingCopyPath,String path) throws SVNException
	{
        //遍历仓库所有子目录
        Collection entries = repository.getDir(path, -1, null,(Collection) null);
        Iterator iterator = entries.iterator();
        while (iterator.hasNext()) 
        {
            SVNDirEntry entry = (SVNDirEntry) iterator.next();
            String entryPath = path + "/" + entry.getName();
            if(path.equals(""))	//必须使用相对路径
            {
            	entryPath = entry.getName();
            }
            System.out.println("entry path " + entryPath);
            File localFile = new File(myWorkingCopyPath,entryPath);
            
            SVNNodeKind entryKind = entry.getKind();
            if(entryKind == SVNNodeKind.FILE)
            {
            	if(!localFile.exists() || localFile.isDirectory())	//本地文件不存在或者类型不符，则删除该文件
                {
                    System.out.println("删除远程文件 " + entryPath);
                    remoteDeleteEntry(entryPath);
                }
            }
            else if(entry.getKind() == SVNNodeKind.DIR) 
            {
            	if(!localFile.exists() || localFile.isFile())	//本地目录不存在或者类型不符，则删除该目录
                {
                    System.out.println("删除目录 " +  entryPath);
                    remoteDeleteEntry(entryPath);
                }
           	    else
           	    {
           	    	doSyncUpForDelete(myWorkingCopyPath, entryPath);
           	    }
            }
        }
	}
	
    //删除文件或目录
  	public boolean remoteDeleteEntry(String path)
  	{
        //删除远程目录或文件
    	long latestRevision = -1;
		try {
			latestRevision = repository.getLatestRevision();
		    System.out.println("Repository latest revision (before committing): " + latestRevision);
	        
	        ISVNEditor editor = repository.getCommitEditor("entry deleted", null);
	        SVNCommitInfo commitInfo  = deleteDir(editor, path);
	        System.out.println("The entry " + path +" was deleted: " + commitInfo);
	        
	        latestRevision = repository.getLatestRevision();
	        System.out.println("Repository latest revision (after committing): " + latestRevision);
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
        return true;
  	}
  	
    public void doSyncUpForAdd(String myWorkingCopyPath, String path) throws SVNException {
		// TODO Auto-generated method stub
    	File file = new File(myWorkingCopyPath + "/" + path);
        if(file.exists())
        {
        	//If Remote path not exist
            SVNNodeKind nodeKind = repository.checkPath(path, -1);
            if (nodeKind == SVNNodeKind.NONE) {
            	System.out.println("add " + path);
            	if(file.isDirectory())
            	{
            		remoteAddDir(path);
            	}
            	else
            	{
            		remoteAddFile(myWorkingCopyPath, path);
            	}
            }
        	
        	File[] tmp=file.listFiles();
            for(int i=0;i<tmp.length;i++)
            {
            	String subPath = path+"/"+tmp[i].getName();
    			if(path.equals(""))
    			{
    				subPath = tmp[i].getName();
    			}
            	if(tmp[i].isDirectory())
            	{
            		//进入子目录
            		doSyncUpForAdd(myWorkingCopyPath,subPath);
                }
                else
                {
                    SVNNodeKind subNodeKind = repository.checkPath(subPath, -1);
                    if (subNodeKind == SVNNodeKind.NONE) 
                    {
                    	System.out.println("add" + subPath);
                    	remoteAddFile(myWorkingCopyPath, subPath);
                    }
                }
            }
       }		
	}
    
    //增加文件
	public boolean remoteAddFile(String localWCPath,String path)
	{
		File file = new File(localWCPath + "/" + path);
        //删除目录
        ISVNEditor editor;
		try {
			byte[] contents = "This is a new file".getBytes();
	        editor = repository.getCommitEditor("directory added", null);
			SVNCommitInfo commitInfo  = doAddFile(editor, path, contents);
			System.out.println("The file was added: " + commitInfo);
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}
	
    //增加目录
	public boolean remoteAddDir(String path)
	{
        //删除目录
        ISVNEditor editor;
		try {
			editor = repository.getCommitEditor("directory added", null);
			SVNCommitInfo commitInfo  = doAddDir(editor, path);
			System.out.println("The directory was added: " + commitInfo);
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}

	//doAddDir
    private SVNCommitInfo doAddDir(ISVNEditor editor, String dirPath) throws SVNException {
        editor.openRoot(-1);
        editor.addDir(dirPath, null, -1);
        //close new added Dir
        editor.closeDir();
        //close the root Dir
        editor.closeDir();
        return editor.closeEdit();
    }

	//doAddFile
    private SVNCommitInfo doAddFile(ISVNEditor editor, String filePath, byte[] data) throws SVNException {
        editor.openRoot(-1);
        editor.addFile(filePath, null, -1);
        editor.applyTextDelta(filePath, null);
        SVNDeltaGenerator deltaGenerator = new SVNDeltaGenerator();
        String checksum = deltaGenerator.sendDelta(filePath, new ByteArrayInputStream(data), editor, true);
        //close new added File
        editor.closeFile(filePath, checksum);
        //close root dir
        editor.closeDir();
        return editor.closeEdit();
    }
    
    //根据当前workingcopy的状态，schedule for add
    public void doScheduleForAdd(String myWorkingCopyPath, String path) throws SVNException {
		System.out.println("path:" + "[" + path + "]");
    	// TODO Auto-generated method stub
    	if(".svn".equals(path) || "/.svn".equals(path))
    	{
    		return;
    	}
    	
    	File file = new File(myWorkingCopyPath + "/" + path);
        if(file.exists())
        {
        	//If Remote path not exist
            SVNNodeKind nodeKind = repository.checkPath(path, -1);
            if(!"".equals(path) && nodeKind == SVNNodeKind.NONE) 	//""表示working copy目录自己，不需要执行for add
            {
            	//schedule for add
              	System.out.println("add " + path);
                addEntry(file);
            }
            else
            {
            	File[] tmp=file.listFiles();
            	for(int i=0;i<tmp.length;i++)
            	{
            		if(!".svn".equals(tmp[i].getName()))
                	{
            			String subPath = path+"/"+tmp[i].getName();
            			if(path.equals(""))
            			{
            				subPath = tmp[i].getName();
            			}
	            	 	if(tmp[i].isDirectory())
	            		{
	            			//进入子目录
	            	 		doScheduleForAdd(myWorkingCopyPath,subPath);
	            		}
	            		else
	            		{
	            			SVNNodeKind subNodeKind = repository.checkPath(subPath, -1);
	            			if (subNodeKind == SVNNodeKind.NONE) 
	            			{
	            				System.out.println("add" + subPath);
	            				addEntry(tmp[i]);
	            			}
	            		}
                	}
            	}
            }
       }		
	}
	
    /*************** Rainy Added Interfaces Based on Low Level APIs End **************/

	
    /*************** Rainy Added Interfaces Based on High Level APIs Start **************/
    //remotePath: 相对于reposUrl的路径
    //myWorkingCopyPath: working copy的根目录
    public boolean doCheckOut(String remotePath, String myWorkingCopyPath) throws SVNException {        
        //检查working copy目录是否存在
        File wcDir = new File(myWorkingCopyPath);
        if (!wcDir.exists()) {
            System.out.println("目录 '"+ wcDir.getAbsolutePath() + "' 不存在!");
            return false;
        }
   
        //将指定仓库的目录URL CheckOut到指定目录   测试
        SVNURL url = repositoryURL.appendPath(remotePath, false);
        System.out.println("Checking out a working copy from '" + url + "' to " + myWorkingCopyPath +"...");
        try {
            checkout(url, SVNRevision.HEAD, wcDir, true);
        } catch (SVNException svne) {
        	error("error while checking out a working copy for the location '" + url + "'", svne);
            svne.printStackTrace();
            if(svne.getErrorMessage().getErrorCode().getCode() == 155027)
            {
            	System.out.println("Tree Conflict");
            	return true;
            }
        	return false;
        }
        System.out.println("Check Out ok");
        return true;
    }

	//doAdd的文件必须在对应的working copy目录下
    public boolean doAdd(String newFilePath) throws SVNException {        
    	/*
         * creates a local directory where the working copy will be checked out into
         */
        File aNewFile = new File(newFilePath);
        if (!aNewFile.exists()) {
            System.out.println(aNewFile.getAbsolutePath() + "' 不存在!");
            return false;
        }
        
        System.out.println("Recursively scheduling a new directory or file'" + aNewFile.getAbsolutePath() + "' for addition...");
        try {
            /*
             * recursively schedules aNewDir for addition
             */
            addEntry(aNewFile);
        } catch (SVNException svne) {
            error("error while recursively adding the directory '" + aNewFile.getAbsolutePath() + "'", svne);
            return false;
        }
        return true;
    }  
    
    //doDelete的文件必须在对应的working copy目录下
    public boolean doDelete(String filePath) throws SVNException {        
    	/*
         * creates a local directory where the working copy will be checked out into
         */
        File deleteFile = new File(filePath);
        ///if (!deleteFile.exists()) {
        //    System.out.println(deleteFile.getAbsolutePath() + "' 不存在!");
        //    return false;
        //}
        
        System.out.println("Scheduling '" + deleteFile.getAbsolutePath() + "' for deletion ...");
        try {
            /*
             * schedules aNewDir for deletion (with forcing)
             */
            delete(deleteFile, true);
        } catch (SVNException svne) {
            error("error while schediling '" + deleteFile.getAbsolutePath() + "' for deletion", svne);
            return false;
        }
        System.out.println();
        return true;
    }  
    
    //将working copy更新到最新版本
    public boolean doUpdate(String myWorkingCopyPath) throws SVNException {        
        //检查working copy的路径是否存在
    	File wcDir = new File(myWorkingCopyPath);
        if (!wcDir.exists()) {
            System.out.println("目录 '"+ wcDir.getAbsolutePath() + "' 不存在!");
            return false;
        }
         
        //将working copy更新到最新版本 
        System.out.println("Updating '" + wcDir.getAbsolutePath() + "'...");
        try {
            update(wcDir, SVNRevision.HEAD, true);
        } catch (SVNException svne) {
            error("error while recursively updating the working copy at '" + wcDir.getAbsolutePath() + "'", svne);
            return false;
        }            
        return true;
    }
    
    //add and commit
    public boolean doAddCommit(String newFilePath,String commitMsg) throws SVNException {        
    	int commitFail = 0;
    	//检查文件是否存在
        File aNewFile = new File(newFilePath);
        if (!aNewFile.exists()) {
            System.out.println(aNewFile.getAbsolutePath() + "' 不存在!");
            return false;
        }
        
        System.out.println("Recursively scheduling a new directory or file'" + aNewFile.getAbsolutePath() + "' for addition...");
        try {
            /*
             * recursively schedules aNewDir for addition
             */
            addEntry(aNewFile);
        } catch (SVNException svne) {
            error("error while recursively adding the directory '"
                    + aNewFile.getAbsolutePath() + "'", svne);
            return false;
        }
           
        System.out.println("Committing changes for '" + aNewFile.getAbsolutePath() + "'...");
        long committedRevision = -1;
        try {
            /*
             * commits changes in wcDir to the repository with not leaving items 
             * locked (if any) after the commit succeeds; this will add aNewDir & 
             * aNewFile to the repository. 
             */
            committedRevision = commit(aNewFile, false, commitMsg).getNewRevision();
        } catch (SVNException svne) {
            System.out.println("error while committing changes to the working copy at '" + aNewFile.getAbsolutePath()+ "'");
            svne.printStackTrace();
            int errCode = svne.getErrorMessage().getErrorCode().getCode();
            System.out.println("error code:" + errCode);  
            if(errCode == 160006)	//Working copy is out of date
            {
            	commitFail = 1;
                System.out.println("working copy is out of date");
                update(aNewFile, SVNRevision.HEAD, true);
            }
            else if(errCode == 155015)
            {
            	commitFail = 2;
                System.out.println("there is commit conflict");
                solveCommitConflict();
            }
            else
            {
            	return false;
            }
        }
        System.out.println("Committed to revision " + committedRevision);
        
        //删除时如果发生commit失败，则update一下再重新commit试一下
        if(commitFail != 0)
        {
        	try {
                /*
                 * commits changes in wcDir to the repository with not leaving items 
                 * locked (if any) after the commit succeeds; this will add aNewDir & 
                 * aNewFile to the repository. 
                 */
                committedRevision = commit(aNewFile, false, commitMsg).getNewRevision();
            } catch (SVNException svne) {
                System.out.println("error while committing changes to the working copy at '" + aNewFile.getAbsolutePath()+ "'");
                svne.printStackTrace();
                return false;
            }
            System.out.println("Committed to revision " + committedRevision);
        }
        return true;
    }
    
    //提交myWorkingCopyPath
    public boolean doCommit(String myWorkingCopyPath,String commitMsg) throws SVNException {        
    	int commitFail = 0;
    	//检查working copy的路径是否存在
    	File wcDir = new File(myWorkingCopyPath);
        if (!wcDir.exists()) {
            System.out.println("目录 '"+ wcDir.getAbsolutePath() + "' 不存在!");
            return false;
        }
           
        System.out.println("Committing changes for '" + wcDir.getAbsolutePath() + "'...");
        long committedRevision = -1;
        try {
            /*
             * commits changes in wcDir to the repository with not leaving items 
             * locked (if any) after the commit succeeds; this will add aNewDir & 
             * aNewFile to the repository. 
             */
            committedRevision = commit(wcDir, false, commitMsg).getNewRevision();
        } catch (SVNException svne) {
            System.out.println("error while committing changes to the working copy at '" + wcDir.getAbsolutePath()+ "'");
            svne.printStackTrace();
            int errCode = svne.getErrorMessage().getErrorCode().getCode();
            System.out.println("error code:" + errCode);  
            if(errCode == 160006)	//Working copy is out of date
            {
            	commitFail = 1;
                System.out.println("working copy is out of date");
                update(wcDir, SVNRevision.HEAD, true);
            }
            else if(errCode == 155015)
            {
            	commitFail = 2;
                System.out.println("there is commit conflict");
                solveCommitConflict();
            }
            else
            {
            	return false;
            }
        }
        System.out.println("Committed to revision " + committedRevision);
        
        
        //删除时如果发生commit失败，则update一下再重新commit试一下
        if(commitFail != 0)
        {
        	try {
                /*
                 * commits changes in wcDir to the repository with not leaving items 
                 * locked (if any) after the commit succeeds; this will add aNewDir & 
                 * aNewFile to the repository. 
                 */
                committedRevision = commit(wcDir, false, commitMsg).getNewRevision();
            } catch (SVNException svne) {
                System.out.println("error while committing changes to the working copy at '" + wcDir.getAbsolutePath()+ "'");
                svne.printStackTrace();
                return false;
            }
            System.out.println("Committed to revision " + committedRevision);
        }
        return true;
	}
    
    private void solveCommitConflict() {
		// TODO Auto-generated method stub
    	
		
	}
    
    //delete and commit
    public boolean doDeleteCommit(String filePath,String commitMsg) throws SVNException {        
        int commitFail = 0;
    	//检查文件是否存在
        File deleteFile = new File(filePath);
        if (deleteFile.exists()) {
            System.out.println(deleteFile.getAbsolutePath() + "' 未删除!");
            return false;
        }
        
        System.out.println("Scheduling '" + deleteFile.getAbsolutePath() + "' for deletion ...");
        try {
            //schedules for deletion (with forcing)
            delete(deleteFile, true);
        } catch (SVNException svne) {
            error("error while schediling '" + deleteFile.getAbsolutePath() + "' for deletion", svne);
            //return false;	//I always assume there will be some exception for file for example: it was already be deleted, I leave something for commit
        }
        
        System.out.println("Committing changes for '" + deleteFile.getAbsolutePath() + "'...");
        long committedRevision = -1;
        try {
            /*
             * commits changes in wcDir to the repository with not leaving items 
             * locked (if any) after the commit succeeds; this will add aNewDir & 
             * aNewFile to the repository. 
             */
            committedRevision = commit(deleteFile, false, commitMsg).getNewRevision();
        } catch (SVNException svne) {
            System.out.println("error while committing changes to the working copy at '" + deleteFile.getAbsolutePath()+ "'");
            svne.printStackTrace();
            int errCode = svne.getErrorMessage().getErrorCode().getCode();
            System.out.println("error code:" + errCode);  
            if(errCode == 160006)	//Working copy is out of date
            {
            	commitFail = 1;
                System.out.println("working copy is out of date");
                update(deleteFile, SVNRevision.HEAD, true);
            }
            else if(errCode == 155015)
            {
            	commitFail = 2;
                System.out.println("there is commit conflict");
                solveCommitConflict();
            }
            else
            {
            	return false;
            }
        }
        System.out.println("Committed to revision " + committedRevision);
        
        //删除时如果发生commit失败，则update一下再重新commit试一下
        if(commitFail != 0)
        {
        	try {
                /*
                 * commits changes in wcDir to the repository with not leaving items 
                 * locked (if any) after the commit succeeds; this will add aNewDir & 
                 * aNewFile to the repository. 
                 */
                committedRevision = commit(deleteFile, false, commitMsg).getNewRevision();
            } catch (SVNException svne) {
                System.out.println("error while committing changes to the working copy at '" + deleteFile.getAbsolutePath()+ "'");
                svne.printStackTrace();
                return false;
            }
        	System.out.println("Committed to revision " + committedRevision);
        }
        
        return true;
    }
    
    //远程copy
    public boolean doCopy(String srcRemotePath,String dstRemotePath,String commitMsg) throws SVNException {        
        
        SVNURL srcURL = repositoryURL.appendPath(srcRemotePath, false);
        SVNURL dstURL = repositoryURL.appendPath(dstRemotePath, false);
        
        System.out.println("Copying '" + srcRemotePath + "' to '" + dstRemotePath + "'...");
        long committedRevision = -1;
        try {
            committedRevision = copy(srcURL, dstURL, false,commitMsg).getNewRevision();
        } catch (SVNException svne) {
            error("error while copying '" + srcURL + "' to '" + dstURL + "'", svne);
            return false;
        }
        System.out.println("Committed to revision " + committedRevision);
        
        return true;
    }
    
    //远程move(rename)
    public boolean doMove(String srcRemotePath,String dstRemotePath,String commitMsg) throws SVNException {        
        
        SVNURL srcURL = repositoryURL.appendPath(srcRemotePath, false);
        SVNURL dstURL = repositoryURL.appendPath(dstRemotePath, false);
        
        System.out.println("Moving '" + srcRemotePath + "' to '" + dstRemotePath + "'...");
        long committedRevision = -1;
        try {
            committedRevision = copy(srcURL, dstURL, true,commitMsg).getNewRevision();
        } catch (SVNException svne) {
            error("error while moving '" + srcURL + "' to '" + dstURL + "'", svne);
            return false;
        }
        System.out.println("Committed to revision " + committedRevision);
        
        return true;
    }
    
    
    //远程doMakeDir
    public boolean doMakeDir(String remotePath,String commitMsg) throws SVNException {        
        
        SVNURL url = repositoryURL.appendPath(remotePath, false);
        
        long committedRevision = -1;
        System.out.println("Making a new directory at '" + url + "'...");
        try{
            committedRevision = makeDirectory(url, commitMsg).getNewRevision();
        }catch(SVNException svne){
            error("error while making a new directory at '" + url + "'", svne);
        }
        System.out.println("Committed to revision " + committedRevision);
        System.out.println();
        
        return true;
    }
    
    //远程doImportDir
    public boolean doImportDir(String localPath, String remotePath,String commitMsg) throws SVNException {        
        //检查working copy的路径是否存在
    	File anImportDir = new File(localPath);
        if (!anImportDir.exists()) {
            System.out.println("目录 '"+ anImportDir.getAbsolutePath() + "' 不存在!");
            return false;
        }
    	
        SVNURL importToURL = repositoryURL.appendPath(remotePath, false);

        long committedRevision = -1;
        System.out.println("Importing a new directory into '" + importToURL + "'...");
        try{
            boolean isRecursive = true;
            committedRevision = importDirectory(anImportDir, importToURL, "importing a new directory '" + anImportDir.getAbsolutePath() + "'", isRecursive).getNewRevision();
        }catch(SVNException svne){
            error("error while importing a new directory '" + anImportDir.getAbsolutePath() + "' into '" + importToURL + "'", svne);
        }
        System.out.println("Committed to revision " + committedRevision);
        System.out.println();
        
        return true;
    }
    /*************** Rainy Added Interfaces Based on High Level APIs End **************/      
	
    /*************** Low Level Interfaces and Use Examples **************/
    /*
     * Initializes the library to work with a repository via 
     * different protocols.
     */
    private static void setupLibrary() {
        /*
         * For using over http:// and https://
         */
        DAVRepositoryFactory.setup();
        /*
         * For using over svn:// and svn+xxx://
         */
        SVNRepositoryFactoryImpl.setup();
        
        /*
         * For using over file:///
         */
        FSRepositoryFactory.setup();
    }
    
    
    public void DisplayReposTree()
    {
        try {
            /*
             * Checks up if the specified path/to/repository part of the URL
             * really corresponds to a directory. If doesn't the program exits.
             * SVNNodeKind is that one who says what is located at a path in a
             * revision. -1 means the latest revision.
             */
            SVNNodeKind nodeKind = repository.checkPath("", -1);
            if (nodeKind == SVNNodeKind.NONE) {
                System.err.println("There is no entry at '" + repositoryURL + "'.");
            } else if (nodeKind == SVNNodeKind.FILE) {
                System.err.println("The entry at '" + repositoryURL + "' is a file while a directory was .r");
            }
            /*
             * getRepositoryRoot() returns the actual root directory where the
             * repository was created. 'true' forces to connect to the repository 
             * if the root url is not cached yet. 
             */
            System.out.println("Repository Root: " + repository.getRepositoryRoot(true));
            /*
             * getRepositoryUUID() returns Universal Unique IDentifier (UUID) of the 
             * repository. 'true' forces to connect to the repository 
             * if the UUID is not cached yet.
             */
            System.out.println("Repository UUID: " + repository.getRepositoryUUID(true));
            System.out.println("");

            /*
             * Displays the repository tree at the current path - "" (what means
             * the path/to/repository directory)
             */
            listEntries(repository, "");
        } catch (SVNException svne) {
            System.err.println("error while listing entries: "
                    + svne.getMessage());
            System.exit(1);
        }
        /*
         * Gets the latest revision number of the repository
         */
        long latestRevision = -1;
        try {
            latestRevision = repository.getLatestRevision();
        } catch (SVNException svne) {
            System.err
                    .println("error while fetching the latest repository revision: "
                            + svne.getMessage());
            System.exit(1);
        }
        System.out.println("");
        System.out.println("---------------------------------------------");
        System.out.println("Repository latest revision: " + latestRevision);
        //System.exit(0);
    }

    /*
     * Called recursively to obtain all entries that make up the repository tree
     * repository - an SVNRepository which interface is used to carry out the
     * request, in this case it's a request to get all entries in the directory
     * located at the path parameter;
     * 
     * path is a directory path relative to the repository location path (that
     * is a part of the URL used to create an SVNRepository instance);
     *  
     */
    private static void listEntries(SVNRepository repository, String path)
            throws SVNException {
        /*
         * Gets the contents of the directory specified by path at the latest
         * revision (for this purpose -1 is used here as the revision number to
         * mean HEAD-revision) getDir returns a Collection of SVNDirEntry
         * elements. SVNDirEntry represents information about the directory
         * entry. Here this information is used to get the entry name, the name
         * of the person who last changed this entry, the number of the revision
         * when it was last changed and the entry type to determine whether it's
         * a directory or a file. If it's a directory listEntries steps into a
         * next recursion to display the contents of this directory. The third
         * parameter of getDir is null and means that a user is not interested
         * in directory properties. The fourth one is null, too - the user
         * doesn't provide its own Collection instance and uses the one returned
         * by getDir.
         */
        Collection entries = repository.getDir(path, -1, null,
                (Collection) null);
        Iterator iterator = entries.iterator();
        while (iterator.hasNext()) {
            SVNDirEntry entry = (SVNDirEntry) iterator.next();
            System.out.println("/" + (path.equals("") ? "" : path + "/")
                    + entry.getName() + " (author: '" + entry.getAuthor()
                    + "'; revision: " + entry.getRevision() + "; date: " + entry.getDate() + ")");
            /*
             * Checking up if the entry is a directory.
             */
            if (entry.getKind() == SVNNodeKind.DIR) {
                listEntries(repository, (path.equals("")) ? entry.getName()
                        : path + "/" + entry.getName());
            }
        }
    }
	
	
    //filePath是基于仓库的相对路径
    public void DisplayFile(String filePath) 
    {
        /*
         * This Map will be used to get the file properties. Each Map key is a
         * property name and the value associated with the key is the property
         * value.
         */
        SVNProperties fileProperties = new SVNProperties();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            /*
             * Checks up if the specified path really corresponds to a file. If
             * doesn't the program exits. SVNNodeKind is that one who says what is
             * located at a path in a revision. -1 means the latest revision.
             */
            SVNNodeKind nodeKind = repository.checkPath(filePath, -1);
            
            if (nodeKind == SVNNodeKind.NONE) {
                System.err.println("There is no entry at '" + repositoryURL + "'.");
                System.exit(1);
            } else if (nodeKind == SVNNodeKind.DIR) {
                System.err.println("The entry at '" + repositoryURL + "' is a directory while a file was expected.");
                System.exit(1);
            }
            /*
             * Gets the contents and properties of the file located at filePath
             * in the repository at the latest revision (which is meant by a
             * negative revision number).
             */
            repository.getFile(filePath, -1, fileProperties, baos);

        } catch (SVNException svne) {
            System.err.println("error while fetching the file contents and properties: " + svne.getMessage());
            System.exit(1);
        }

        /*
         * Here the SVNProperty class is used to get the value of the
         * svn:mime-type property (if any). SVNProperty is used to facilitate
         * the work with versioned properties.
         */
        String mimeType = fileProperties.getStringValue(SVNProperty.MIME_TYPE);

        /*
         * SVNProperty.isTextMimeType(..) method checks up the value of the mime-type
         * file property and says if the file is a text (true) or not (false).
         */
        boolean isTextType = SVNProperty.isTextMimeType(mimeType);

        Iterator iterator = fileProperties.nameSet().iterator();
        /*
         * Displays file properties.
         */
        while (iterator.hasNext()) {
            String propertyName = (String) iterator.next();
            String propertyValue = fileProperties.getStringValue(propertyName);
            System.out.println("File property: " + propertyName + "="
                    + propertyValue);
        }
        /*
         * Displays the file contents in the console if the file is a text.
         */
        if (isTextType) {
            System.out.println("File contents:");
            System.out.println();
            try {
                baos.writeTo(System.out);
            } catch (IOException ioe) {
                ioe.printStackTrace();
            }
        } else {
            System.out
                    .println("File contents can not be displayed in the console since the mime-type property says that it's not a kind of a text file.");
        }
        /*
         * Gets the latest revision number of the repository
         */
        long latestRevision = -1;
        try {
            latestRevision = repository.getLatestRevision();
        } catch (SVNException svne) {
            System.err.println("error while fetching the latest repository revision: " + svne.getMessage());
            System.exit(1);
        }
        System.out.println("");
        System.out.println("---------------------------------------------");
        System.out.println("Repository latest revision: " + latestRevision);
        //System.exit(0);
    }
    
    //filePath: remote File Path under repositoryURL
    public void DisplayHistory(String fielPath,long startRevision, long endRevision) 
    {
        /*
         * Gets the latest revision number of the repository
         */
        try {
            endRevision = repository.getLatestRevision();
        } catch (SVNException svne) {
            System.err.println("error while fetching the latest repository revision: " + svne.getMessage());
            System.exit(1);
        }

        Collection logEntries = null;
        try {
            /*
             * Collects SVNLogEntry objects for all revisions in the range
             * defined by its start and end points [startRevision, endRevision].
             * For each revision commit information is represented by
             * SVNLogEntry.
             * 
             * the 1st parameter (targetPaths - an array of path strings) is set
             * when restricting the [startRevision, endRevision] range to only
             * those revisions when the paths in targetPaths were changed.
             * 
             * the 2nd parameter if non-null - is a user's Collection that will
             * be filled up with found SVNLogEntry objects; it's just another
             * way to reach the scope.
             * 
             * startRevision, endRevision - to define a range of revisions you are
             * interested in; by default in this program - startRevision=0, endRevision=
             * the latest (HEAD) revision of the repository.
             * 
             * the 5th parameter - a boolean flag changedPath - if true then for
             * each revision a corresponding SVNLogEntry will contain a map of
             * all paths which were changed in that revision.
             * 
             * the 6th parameter - a boolean flag strictNode - if false and a
             * changed path is a copy (branch) of an existing one in the repository
             * then the history for its origin will be traversed; it means the 
             * history of changes of the target URL (and all that there's in that 
             * URL) will include the history of the origin path(s).
             * Otherwise if strictNode is true then the origin path history won't be
             * included.
             * 
             * The return value is a Collection filled up with SVNLogEntry Objects.
             */
            logEntries = repository.log(new String[] {""}, null,
                    startRevision, endRevision, true, true);

        } catch (SVNException svne) {
            System.out.println("error while collecting log information for '" + repositoryURL + "': " + svne.getMessage());
        }
        for (Iterator entries = logEntries.iterator(); entries.hasNext();) {
            /*
             * gets a next SVNLogEntry
             */
            SVNLogEntry logEntry = (SVNLogEntry) entries.next();
            System.out.println("---------------------------------------------");
            /*
             * gets the revision number
             */
            System.out.println("revision: " + logEntry.getRevision());
            /*
             * gets the author of the changes made in that revision
             */
            System.out.println("author: " + logEntry.getAuthor());
            /*
             * gets the time moment when the changes were committed
             */
            System.out.println("date: " + logEntry.getDate());
            /*
             * gets the commit log message
             */
            System.out.println("log message: " + logEntry.getMessage());
            /*
             * displaying all paths that were changed in that revision; cahnged
             * path information is represented by SVNLogEntryPath.
             */
            if (logEntry.getChangedPaths().size() > 0) {
                System.out.println();
                System.out.println("changed paths:");
                /*
                 * keys are changed paths
                 */
                Set changedPathsSet = logEntry.getChangedPaths().keySet();

                for (Iterator changedPaths = changedPathsSet.iterator(); changedPaths
                        .hasNext();) {
                    /*
                     * obtains a next SVNLogEntryPath
                     */
                    SVNLogEntryPath entryPath = (SVNLogEntryPath) logEntry
                            .getChangedPaths().get(changedPaths.next());
                    /*
                     * SVNLogEntryPath.getPath returns the changed path itself;
                     * 
                     * SVNLogEntryPath.getType returns a charecter describing
                     * how the path was changed ('A' - added, 'D' - deleted or
                     * 'M' - modified);
                     * 
                     * If the path was copied from another one (branched) then
                     * SVNLogEntryPath.getCopyPath &
                     * SVNLogEntryPath.getCopyRevision tells where it was copied
                     * from and what revision the origin path was at.
                     */
                    System.out.println(" "
                            + entryPath.getType()
                            + "	"
                            + entryPath.getPath()
                            + ((entryPath.getCopyPath() != null) ? " (from "
                                    + entryPath.getCopyPath() + " revision "
                                    + entryPath.getCopyRevision() + ")" : ""));
                }
            }
        }
    }


    public void CommitTest() {        
        /*
         * Run commit example and process error if any.
         */
        try {
            commitExample();
        } catch (SVNException e) {
            SVNErrorMessage err = e.getErrorMessage();
            /*
             * Display all tree of error messages. 
             * Utility method SVNErrorMessage.getFullMessage() may be used instead of the loop.
             */
            while(err != null) {
                System.err.println(err.getErrorCode().getCode() + " : " + err.getMessage());
                err = err.getChildErrorMessage();
            }
        }
    }

    private void commitExample() throws SVNException {        
        /*
         * Sample file contents.
         */
        byte[] contents = "This is a new file".getBytes();
        byte[] modifiedContents = "This is the same file but modified a little.".getBytes();

        //检查仓库的根目录的属性
        SVNNodeKind nodeKind = repository.checkPath("", -1);
        if (nodeKind == SVNNodeKind.NONE) {
            SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.UNKNOWN, "No entry at URL ''{0}''", repositoryURL);
            throw new SVNException(err);
        } else if (nodeKind == SVNNodeKind.FILE) {
            SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.UNKNOWN, "Entry at URL ''{0}'' is a file while directory was expected", repositoryURL);
            throw new SVNException(err);
        }
        
        //获取最新的revision
        long latestRevision = repository.getLatestRevision();
        System.out.println("Repository latest revision (before committing): " + latestRevision);
        
        //获取 editor and addDir
        ISVNEditor editor = repository.getCommitEditor("directory and file added", null);
        SVNCommitInfo commitInfo = addDir(editor, "test", "test/file.txt", contents);
        System.out.println("The directory was added: " + commitInfo);

        //获取 editor and modifyFile
        editor = repository.getCommitEditor("file contents changed", null);
        commitInfo = modifyFile(editor, "test", "test/file.txt", contents, modifiedContents);
        System.out.println("The file was changed: " + commitInfo);

        //获取 editor and copyDir
        String absoluteSrcPath = repository.getRepositoryPath("test");
        long srcRevision = repository.getLatestRevision();
        editor = repository.getCommitEditor("directory copied", null);        
        commitInfo = copyDir(editor, absoluteSrcPath, "test2", srcRevision);
        System.out.println("The directory was copied: " + commitInfo);

        //获取 editor and deleteDir
        editor = repository.getCommitEditor("directory deleted", null);
        commitInfo = deleteDir(editor, "test");
        System.out.println("The directory was deleted: " + commitInfo);

        //获取 editor and deleteDir 
        editor = repository.getCommitEditor("copied directory deleted", null);
        commitInfo = deleteDir(editor, "test2");
        System.out.println("The copied directory was deleted: " + commitInfo);
        
        latestRevision = repository.getLatestRevision();
        System.out.println("Repository latest revision (after committing): " + latestRevision);
    }

    /*
     * This method performs commiting an addition of a  directory  containing  a
     * file.
     */
    private SVNCommitInfo addDir(ISVNEditor editor, String dirPath,
            String filePath, byte[] data) throws SVNException {
        /*
         * Always called first. Opens the current root directory. It  means  all
         * modifications will be applied to this directory until  a  next  entry
         * (located inside the root) is opened/added.
         * 
         * -1 - revision is HEAD (actually, for a comit  editor  this number  is 
         * irrelevant)
         */
        editor.openRoot(-1);
        /*
         * Adds a new directory (in this  case - to the  root  directory  for 
         * which the SVNRepository was  created). 
         * Since this moment all changes will be applied to this new  directory.
         * 
         * dirPath is relative to the root directory.
         * 
         * copyFromPath (the 2nd parameter) is set to null and  copyFromRevision
         * (the 3rd) parameter is set to  -1  since  the  directory is not added 
         * with history (is not copied, in other words).
         */
        editor.addDir(dirPath, null, -1);
        /*
         * Adds a new file to the just added  directory. The  file  path is also 
         * defined as relative to the root directory.
         *
         * copyFromPath (the 2nd parameter) is set to null and  copyFromRevision
         * (the 3rd parameter) is set to -1 since  the file is  not  added  with 
         * history.
         */
        editor.addFile(filePath, null, -1);
        /*
         * The next steps are directed to applying delta to the  file  (that  is 
         * the full contents of the file in this case).
         */
        editor.applyTextDelta(filePath, null);
        /*
         * Use delta generator utility class to generate and send delta
         * 
         * Note that you may use only 'target' data to generate delta when there is no 
         * access to the 'base' (previous) version of the file. However, using 'base' 
         * data will result in smaller network overhead.
         * 
         * SVNDeltaGenerator will call editor.textDeltaChunk(...) method for each generated 
         * "diff window" and then editor.textDeltaEnd(...) in the end of delta transmission.  
         * Number of diff windows depends on the file size. 
         *  
         */
        SVNDeltaGenerator deltaGenerator = new SVNDeltaGenerator();
        String checksum = deltaGenerator.sendDelta(filePath, new ByteArrayInputStream(data), editor, true);

        /*
         * Closes the new added file.
         */
        editor.closeFile(filePath, checksum);
        /*
         * Closes the new added directory.
         */
        editor.closeDir();
        /*
         * Closes the root directory.
         */
        editor.closeDir();
        /*
         * This is the final point in all editor handling. Only now all that new
         * information previously described with the editor's methods is sent to
         * the server for committing. As a result the server sends the new
         * commit information.
         */
        return editor.closeEdit();
    }

    /*
     * This method performs committing file modifications.
     */
    private SVNCommitInfo modifyFile(ISVNEditor editor, String dirPath,
            String filePath, byte[] oldData, byte[] newData) throws SVNException {
        /*
         * Always called first. Opens the current root directory. It  means  all
         * modifications will be applied to this directory until  a  next  entry
         * (located inside the root) is opened/added.
         * 
         * -1 - revision is HEAD
         */
        editor.openRoot(-1);
        /*
         * Opens a next subdirectory (in this example program it's the directory
         * added  in  the  last  commit).  Since this moment all changes will be
         * applied to this directory.
         * 
         * dirPath is relative to the root directory.
         * -1 - revision is HEAD
         */
        editor.openDir(dirPath, -1);
        /*
         * Opens the file added in the previous commit.
         * 
         * filePath is also defined as a relative path to the root directory.
         */
        editor.openFile(filePath, -1);
        
        /*
         * The next steps are directed to applying and writing the file delta.
         */
        editor.applyTextDelta(filePath, null);
        
        /*
         * Use delta generator utility class to generate and send delta
         * 
         * Note that you may use only 'target' data to generate delta when there is no 
         * access to the 'base' (previous) version of the file. However, here we've got 'base' 
         * data, what in case of larger files results in smaller network overhead.
         * 
         * SVNDeltaGenerator will call editor.textDeltaChunk(...) method for each generated 
         * "diff window" and then editor.textDeltaEnd(...) in the end of delta transmission.  
         * Number of diff windows depends on the file size. 
         *  
         */
        SVNDeltaGenerator deltaGenerator = new SVNDeltaGenerator();
        String checksum = deltaGenerator.sendDelta(filePath, new ByteArrayInputStream(oldData), 0, new ByteArrayInputStream(newData), editor, true);

        /*
         * Closes the file.
         */
        editor.closeFile(filePath, checksum);

        /*
         * Closes the directory.
         */
        editor.closeDir();

        /*
         * Closes the root directory.
         */
        editor.closeDir();

        /*
         * This is the final point in all editor handling. Only now all that new
         * information previously described with the editor's methods is sent to
         * the server for committing. As a result the server sends the new
         * commit information.
         */
        return editor.closeEdit();
    }

    /*
     * This method performs committing a deletion of a directory.
     */
    private SVNCommitInfo deleteDir(ISVNEditor editor, String dirPath) throws SVNException {
        /*
         * Always called first. Opens the current root directory. It  means  all
         * modifications will be applied to this directory until  a  next  entry
         * (located inside the root) is opened/added.
         * 
         * -1 - revision is HEAD
         */
        editor.openRoot(-1);
        /*
         * Deletes the subdirectory with all its contents.
         * 
         * dirPath is relative to the root directory.
         */
        editor.deleteEntry(dirPath, -1);
        /*
         * Closes the root directory.
         */
        editor.closeDir();
        /*
         * This is the final point in all editor handling. Only now all that new
         * information previously described with the editor's methods is sent to
         * the server for committing. As a result the server sends the new
         * commit information.
         */
        return editor.closeEdit();
    }

    /*
     * This  method  performs how a directory in the repository can be copied to
     * branch.
     */
    private SVNCommitInfo copyDir(ISVNEditor editor, String srcDirPath,
            String dstDirPath, long revision) throws SVNException {
        /*
         * Always called first. Opens the current root directory. It  means  all
         * modifications will be applied to this directory until  a  next  entry
         * (located inside the root) is opened/added.
         * 
         * -1 - revision is HEAD
         */
        editor.openRoot(-1);
        
        /*
         * Adds a new directory that is a copy of the existing one.
         * 
         * srcDirPath   -  the  source  directory  path (relative  to  the  root 
         * directory).
         * 
         * dstDirPath - the destination directory path where the source will be
         * copied to (relative to the root directory).
         * 
         * revision    - the number of the source directory revision. 
         */
        editor.addDir(dstDirPath, srcDirPath, revision);
        /*
         * Closes the just added copy of the directory.
         */
        editor.closeDir();
        /*
         * Closes the root directory.
         */
        editor.closeDir();
        /*
         * This is the final point in all editor handling. Only now all that new
         * information previously described with the editor's methods is sent to
         * the server for committing. As a result the server sends the new
         * commit information.
         */
        return editor.closeEdit();
    }
    
    
    public void ExportTest() 
    {        
        /*
         * Run export example and process error if any.
         */
        try {
            exportExample();
        } catch (SVNException e) {
            SVNErrorMessage err = e.getErrorMessage();
            /*
             * Display all tree of error messages. 
             * Utility method SVNErrorMessage.getFullMessage() may be used instead of the loop.
             */
            while(err != null) {
                System.err.println(err.getErrorCode().getCode() + " : " + err.getMessage());
                err = err.getChildErrorMessage();
            }
            System.exit(1);
        }
        //System.exit(0);
    }

    private void exportExample() throws SVNException {
        /*
         * Prepare filesystem directory (export destination).
         */
        File exportDir = new File("export");
        if (exportDir.exists()) {
            SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.IO_ERROR, "Path ''{0}'' already exists", exportDir);
            throw new SVNException(err);
        }
        exportDir.mkdirs();

        /*
         * Get type of the node located at URL we used to create SVNRepository.
         * 
         * "" (empty string) is path relative to that URL, 
         * -1 is value that may be used to specify HEAD (latest) revision.
         */
        SVNNodeKind nodeKind = repository.checkPath("", -1);
        if (nodeKind == SVNNodeKind.NONE) {
            SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.UNKNOWN, "No entry at URL ''{0}''", repositoryURL);
            throw new SVNException(err);
        } else if (nodeKind == SVNNodeKind.FILE) {
            SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.UNKNOWN, "Entry at URL ''{0}'' is a file while directory was expected", repositoryURL);
            throw new SVNException(err);
        }

        /*
         * Get latest repository revision. We will export repository contents at this very revision.
         */
        long latestRevision = repository.getLatestRevision();
        
        /*
         * Create reporterBaton. This class is responsible for reporting 'wc state' to the server.
         * 
         * In this example it will always report that working copy is empty to receive update
         * instructions that are sufficient to create complete directories hierarchy and get full
         * files contents.
         */
        ISVNReporterBaton reporterBaton = new ExportReporterBaton(latestRevision);
        
        /*
         * Create editor. This class will process update instructions received from the server and 
         * will create directories and files accordingly.
         * 
         * As we've reported 'emtpy working copy', server will only send 'addDir/addFile' instructions
         * and will never ask our editor implementation to modify a file or directory properties. 
         */
        ISVNEditor exportEditor = new ExportEditor(exportDir);
        
        /*
         * Now ask SVNKit to perform generic 'update' operation using our reporter and editor.
         * 
         * We are passing:
         * 
         * - revision from which we would like to export
         * - null as "target" name, to perform export from the URL SVNRepository was created for, 
         *   not from some child directory.
         * - reporterBaton
         * - exportEditor.  
         */
        repository.update(latestRevision, null, true, reporterBaton, exportEditor);
        
        System.out.println("Exported revision: " + latestRevision);
    }

    /*
     * ReporterBaton implementation that always reports 'empty wc' state.
     */
    private static class ExportReporterBaton implements ISVNReporterBaton {

        private long exportRevision;
        
        public ExportReporterBaton(long revision){
            exportRevision = revision;
        }
        
        public void report(ISVNReporter reporter) throws SVNException {
            try {
                /*
                 * Here empty working copy is reported.
                 * 
                 * ISVNReporter includes methods that allows to report mixed-rev working copy
                 * and even let server know that some files or directories are locally missing or
                 * locked. 
                 */
                reporter.setPath("", null, exportRevision, SVNDepth.INFINITY, true);
                
                /*
                 * Don't forget to finish the report!
                 */
                reporter.finishReport(); 
            } catch (SVNException svne) {
                reporter.abortReport();
                System.out.println("Report failed.");
            }
        }
    }

    /*
     * ISVNEditor implementation that will add directories and files into the target directory
     * accordingly to update instructions sent by the server. 
     */
    private static class ExportEditor implements ISVNEditor {
        
        private File myRootDirectory;
        private SVNDeltaProcessor myDeltaProcessor;
        
        /*
         * root - the local directory where the node tree is to be exported into.
         */
        public ExportEditor(File root) {
            myRootDirectory = root;
            /*
             * Utility class that will help us to transform 'deltas' sent by the 
             * server to the new file contents.  
             */
            myDeltaProcessor = new SVNDeltaProcessor();
        }

        /*
         * Server reports revision to which application of the further 
         * instructions will update working copy to.
         */
        public void targetRevision(long revision) throws SVNException {
        }

        /*
         * Called before sending other instructions.
         */
        public void openRoot(long revision) throws SVNException {
        }
        
        /*
         * Called when a new directory has to be added.
         * 
         * For each 'addDir' call server will call 'closeDir' method after 
         * all children of the added directory are added.
         * 
         * This implementation creates corresponding directory below root directory. 
         */
        public void addDir(String path, String copyFromPath, long copyFromRevision) throws SVNException {
            File newDir = new File(myRootDirectory, path);
            if (!newDir.exists()) {
                if (!newDir.mkdirs()) {
                    SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.IO_ERROR, "error: failed to add the directory ''{0}''.", newDir);
                    throw new SVNException(err);
                }
            }
            System.out.println("dir added: " + path);
        }
        
        /*
         * Called when there is an existing directory that has to be 'opened' either 
         * to modify this directory properties or to process other files and directories 
         * inside this directory. 
         * 
         * In case of export this method will never be called because we reported 
         * that our 'working copy' is empty and so server knows that there are
         * no 'existing' directories. 
         */
        public void openDir(String path, long revision) throws SVNException {
        }

        /*
         * Instructs to change opened or added directory property.
         *   
         * This method is called to update properties set by the user as well
         * as those created automatically, like "svn:committed-rev". 
         * See SVNProperty class for default property names. 
         * 
         * When property has to be deleted value will be 'null'. 
         */

        public void changeDirProperty(String name, SVNPropertyValue property) throws SVNException {
		}

        /*
         * Called when a new file has to be created.
         * 
         * For each 'addFile' call server will call 'closeFile' method after 
         * sending file properties and contents. 
         * 
         * This implementation creates empty file below root directory, file contents
         * will be updated later, and for empty files may not be sent at all. 
         */
        public void addFile(String path, String copyFromPath, long copyFromRevision) throws SVNException {
            File file = new File(myRootDirectory, path);
            if (file.exists()) {
                SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.IO_ERROR, "error: exported file ''{0}'' already exists!", file);
                throw new SVNException(err);
            }
            try {
                file.createNewFile();
            } catch (IOException e) {
                SVNErrorMessage err = SVNErrorMessage.create(SVNErrorCode.IO_ERROR, "error: cannot create new  file ''{0}''", file);
                throw new SVNException(err);
            }
        }
        
        /*
         * Called when there is an existing files that has to be 'opened' either 
         * to modify file contents or properties.
         * 
         * In case of export this method will never be called because we reported 
         * that our 'working copy' is empty and so server knows that there are
         * no 'existing' files. 
         */
        public void openFile(String path, long revision) throws SVNException {
        }

        /*
         * Instructs to add, modify or delete file property.
         * In this example we skip this instruction, but 'real' export operation
         * may inspect 'svn:eol-style' or 'svn:mime-type' property values to 
         * transfor file contents propertly after receiving.
         */

        public void changeFileProperty(String path, String name, SVNPropertyValue property) throws SVNException {
		}

        /*
         * Called before sending 'delta' for a file. Delta may include instructions
         * on how to create a file or how to modify existing file. In this example
         * delta will always contain instructions on how to create a new file and so
         * we set up deltaProcessor with 'null' base file and target file to which we would 
         * like to store the result of delta application. 
         */
        public void applyTextDelta(String path, String baseChecksum) throws SVNException {
            myDeltaProcessor.applyTextDelta((File) null, new File(myRootDirectory, path), false);
        }

        /*
         * Server sends deltas in form of 'diff windows'. Depending on the file size 
         * there may be several diff windows. Utility class SVNDeltaProcessor processes 
         * these windows for us.
         */
        public OutputStream textDeltaChunk(String path, SVNDiffWindow diffWindow)   throws SVNException {
            return myDeltaProcessor.textDeltaChunk(diffWindow);
        }
        
        /*
         * Called when all diff windows (delta) is transferred. 
         */
        public void textDeltaEnd(String path) throws SVNException {
            myDeltaProcessor.textDeltaEnd();
        }
        
        /*
         * Called when file update is completed. 
         * This call always matches addFile or openFile call.
         */
        public void closeFile(String path, String textChecksum) throws SVNException {
            System.out.println("file added: " + path);
        }

        /*
         * Called when all child files and directories are processed. 
         * This call always matches addDir, openDir or openRoot call.
         */
        public void closeDir() throws SVNException {
        }

        /*
         * Insturcts to delete an entry in the 'working copy'. Of course will not be 
         * called during export operation. 
         */
        public void deleteEntry(String path, long revision) throws SVNException {
        }
        
        /*
         * Called when directory at 'path' should be somehow processed, 
         * but authenticated user (or anonymous user) doesn't have enough 
         * access rights to get information on this directory (properties, children).
         */
        public void absentDir(String path) throws SVNException {
        }

        /*
         * Called when file at 'path' should be somehow processed, 
         * but authenticated user (or anonymous user) doesn't have enough 
         * access rights to get information on this file (contents, properties).
         */
        public void absentFile(String path) throws SVNException {
        }        
        
        /*
         * Called when update is completed. 
         */
        public SVNCommitInfo closeEdit() throws SVNException {
            return null;
        }
        
        /*
         * Called when update is completed with an error or server 
         * requests client to abort update operation. 
         */
        public void abortEdit() throws SVNException {
        }

    }

    
    /*************** High Level Interfaces and Use Examples **************/
    public void WorkingCopyTest(String reposURL,  String name, String password, String myWorkingCopyPath) throws SVNException {
        System.out.println("测试开始");
    	//设置测试用变量
        String newDir = "/newDir";
        String newFile = newDir + "/newFile.txt";
        String fileText = "This is a new file added to the working copy";

        /*
         * That's where '/MyRepos' will be copied to (branched)
         */
        SVNURL copyURL = repositoryURL.appendPath("MyReposCopy", false);

        //新建目录
        doMakeDir("MyRepos","远程新建目录MyRepos");

        
        //将本地目录 /importDir 导入到 仓库指定目录 测试
        String importDir = "/importDir";
        String importFile = importDir + "/importFile.txt";
        String importFileText = "This unversioned file is imported into a repository";
        File anImportDir = new File(importDir);
        File anImportFile = new File(anImportDir, SVNPathUtil.tail(importFile));        
        createLocalDir(anImportDir, new File[]{anImportFile}, new String[]{importFileText});
        doImportDir(importDir,importDir,"importing a new directory '" + anImportDir.getAbsolutePath() + "'");
        
        //将指定仓库的目录URL CheckOut到指定目录   测试
        File wcDir = new File(myWorkingCopyPath);
        if (wcDir.exists()) {
            error("the destination directory '" + wcDir.getAbsolutePath() + "' already exists!", null);
        }
        wcDir.mkdirs();
        doCheckOut("MyRepos",myWorkingCopyPath);
        
        //显示WorkingCopy测试
        try {
            showInfo(wcDir, SVNRevision.WORKING, true);
        } catch (SVNException svne) {
            error("error while recursively getting info for the working copy at'"
                    + wcDir.getAbsolutePath() + "'", svne);
        }
        System.out.println();

        //将working copy新增的文件加入版本控制
        File aNewDir = new File(wcDir, newDir);
        File aNewFile = new File(aNewDir, SVNPathUtil.tail(newFile));
        createLocalDir(aNewDir, new File[]{aNewFile}, new String[]{fileText});
        doAdd(aNewDir.getAbsolutePath());
        
        //显示working copy目录的指定信息
        boolean isRecursive = true;
        boolean isRemote = true;
        boolean isReportAll = false;
        boolean isIncludeIgnored = true;
        boolean isCollectParentExternals = false;
        System.out.println("Status for '" + wcDir.getAbsolutePath() + "':");
        try {
            showStatus(wcDir, isRecursive, isRemote, isReportAll,
                    isIncludeIgnored, isCollectParentExternals);
        } catch (SVNException svne) {
            error("error while recursively performing status for '"
                    + wcDir.getAbsolutePath() + "'", svne);
        }
        System.out.println();
        
        //将working copy更新到最新版本 
        System.out.println("Updating '" + wcDir.getAbsolutePath() + "'...");
        try {
            update(wcDir, SVNRevision.HEAD, true);
        } catch (SVNException svne) {
            error("error while recursively updating the working copy at '"
                    + wcDir.getAbsolutePath() + "'", svne);
        }
        System.out.println("");
        
        //提交修改到仓库
        doCommit(myWorkingCopyPath,"'/newDir' with '/newDir/newFile.txt' were added");

        //锁定文件测试
        System.out.println("Locking (with stealing if the entry is already locked) '"
                        + aNewFile.getAbsolutePath() + "'.");
        try {
            /*
             * locks aNewFile with stealing (if it has been already locked by someone
             * else), providing a lock comment
             */
            lock(aNewFile, true, "locking '/newDir/newFile.txt'");
        } catch (SVNException svne) {
            error("error while locking the working copy file '"
                    + aNewFile.getAbsolutePath() + "'", svne);
        }
        System.out.println();

        System.out.println("Status for '" + wcDir.getAbsolutePath() + "':");
        try {
            /*
             * displays status once again to see the file is really locked
             */
            showStatus(wcDir, isRecursive, isRemote, isReportAll,
                    isIncludeIgnored, isCollectParentExternals);
        } catch (SVNException svne) {
            error("error while recursively performing status for '"
                    + wcDir.getAbsolutePath() + "'", svne);
        }
        System.out.println();
        
        //仓库目录复制测试
        doCopy("MyRepos","MyReposCopy","remotely copying MyRepos to MyReposCopy");

        //URL Switch测试
        System.out.println("Switching '" + wcDir.getAbsolutePath() + "' to '"
                + copyURL + "'...");
        try {
            /*
             * recursively switches wcDir to copyURL in the latest revision 
             * (SVNRevision.HEAD)
             */
            switchToURL(wcDir, copyURL, SVNRevision.HEAD, true);
        } catch (SVNException svne) {
            error("error while switching '"
                    + wcDir.getAbsolutePath() + "' to '" + copyURL + "'", svne);
        }
        System.out.println();

        /*
         * recursively displays info for the working copy once again to see
         * it was really switched to a new URL
         */
        try {
            showInfo(wcDir, SVNRevision.WORKING, true);
        } catch (SVNException svne) {
            error("error while recursively getting info for the working copy at'"
                    + wcDir.getAbsolutePath() + "'", svne);
        }
        System.out.println();

        //目录删除测试
        doDelete(aNewDir.getAbsolutePath());

        System.out.println("Status for '" + wcDir.getAbsolutePath() + "':");
        try {
            /*
             * recursively displays status once more to see whether aNewDir
             * was really scheduled for deletion  
             */
            showStatus(wcDir, isRecursive, isRemote, isReportAll,
                    isIncludeIgnored, isCollectParentExternals);
        } catch (SVNException svne) {
            error("error while recursively performing status for '"
                    + wcDir.getAbsolutePath() + "'", svne);
        }
        System.out.println();

        doCommit(wcDir.getAbsolutePath(),"删除目录" + aNewDir.getAbsolutePath());
        
        System.out.println("测试结束");
    }

    /*
     * Creates a new version controlled directory (doesn't create any intermediate
     * directories) right in a repository. Like 'svn mkdir URL -m "some comment"' 
     * command. It's done by invoking 
     * 
     * SVNCommitClient.doMkDir(SVNURL[] urls, String commitMessage) 
     * 
     * which takes the following parameters:
     * 
     * urls - an array of URLs that are to be created;
     * 
     * commitMessage - a commit log message since a URL-based directory creation is 
     * immediately committed to a repository.
     */
    public SVNCommitInfo makeDirectory(SVNURL url, String commitMessage) throws SVNException{
        /*
         * Returns SVNCommitInfo containing information on the new revision committed 
         * (revision number, etc.) 
         */
        return ourClientManager.getCommitClient().doMkDir(new SVNURL[]{url}, commitMessage);
    }
    
    /*
     * Imports an unversioned directory into a repository location denoted by a
     * destination URL (all necessary parent non-existent paths will be created 
     * automatically). This operation commits the repository to a new revision. 
     * Like 'svn import PATH URL (-N) -m "some comment"' command. It's done by 
     * invoking 
     * 
     * SVNCommitClient.doImport(File path, SVNURL dstURL, String commitMessage, boolean recursive) 
     * 
     * which takes the following parameters:
     * 
     * path - a local unversioned directory or singal file that will be imported into a 
     * repository;
     * 
     * dstURL - a repository location where the local unversioned directory/file will be 
     * imported into; this URL path may contain non-existent parent paths that will be 
     * created by the repository server;
     * 
     * commitMessage - a commit log message since the new directory/file are immediately
     * created in the repository;
     * 
     * recursive - if true and path parameter corresponds to a directory then the directory
     * will be added with all its child subdirictories, otherwise the operation will cover
     * only the directory itself (only those files which are located in the directory).  
     */
    public SVNCommitInfo importDirectory(File localPath, SVNURL dstURL, String commitMessage, boolean isRecursive) throws SVNException{
        /*
         * Returns SVNCommitInfo containing information on the new revision committed 
         * (revision number, etc.) 
         */
        return ourClientManager.getCommitClient().doImport(localPath, dstURL, commitMessage, isRecursive);
        
    }
    /*
     * Committs changes in a working copy to a repository. Like 
     * 'svn commit PATH -m "some comment"' command. It's done by invoking 
     * 
     * SVNCommitClient.doCommit(File[] paths, boolean keepLocks, String commitMessage, 
     * boolean force, boolean recursive) 
     * 
     * which takes the following parameters:
     * 
     * paths - working copy paths which changes are to be committed;
     * 
     * keepLocks - if true then doCommit(..) won't unlock locked paths; otherwise they will
     * be unlocked after a successful commit; 
     * 
     * commitMessage - a commit log message;
     * 
     * force - if true then a non-recursive commit will be forced anyway;  
     * 
     * recursive - if true and a path corresponds to a directory then doCommit(..) recursively 
     * commits changes for the entire directory, otherwise - only for child entries of the 
     * directory;
     */
    private SVNCommitInfo commit(File wcPath, boolean keepLocks, String commitMessage)
            throws SVNException {
        /*
         * Returns SVNCommitInfo containing information on the new revision committed 
         * (revision number, etc.) 
         */
        return ourClientManager.getCommitClient().doCommit(new File[] { wcPath }, keepLocks,
                commitMessage, false, true);
    }

    /*
     * Checks out a working copy from a repository. Like 'svn checkout URL[@REV] PATH (-r..)'
     * command; It's done by invoking 
     * 
     * SVNUpdateClient.doCheckout(SVNURL url, File dstPath, SVNRevision pegRevision, 
     * SVNRevision revision, boolean recursive)
     * 
     * which takes the following parameters:
     * 
     * url - a repository location from where a working copy is to be checked out;
     * 
     * dstPath - a local path where the working copy will be fetched into;
     * 
     * pegRevision - an SVNRevision representing a revision to concretize
     * url (what exactly URL a user means and is sure of being the URL he needs); in other
     * words that is the revision in which the URL is first looked up;
     * 
     * revision - a revision at which a working copy being checked out is to be; 
     * 
     * recursive - if true and url corresponds to a directory then doCheckout(..) recursively 
     * fetches out the entire directory, otherwise - only child entries of the directory;   
     */
    public long checkout(SVNURL url,
            SVNRevision revision, File destPath, boolean isRecursive)
            throws SVNException {

        SVNUpdateClient updateClient = ourClientManager.getUpdateClient();
        /*
         * sets externals not to be ignored during the checkout
         */
        updateClient.setIgnoreExternals(false);
        /*
         * returns the number of the revision at which the working copy is 
         */
        return updateClient.doCheckout(url, destPath, revision, revision, isRecursive);
    }
    
    /*
     * Updates a working copy (brings changes from the repository into the working copy). 
     * Like 'svn update PATH' command; It's done by invoking 
     * 
     * SVNUpdateClient.doUpdate(File file, SVNRevision revision, boolean recursive) 
     * 
     * which takes the following parameters:
     * 
     * file - a working copy entry that is to be updated;
     * 
     * revision - a revision to which a working copy is to be updated;
     * 
     * recursive - if true and an entry is a directory then doUpdate(..) recursively 
     * updates the entire directory, otherwise - only child entries of the directory;   
     */
    public long update(File wcPath,
            SVNRevision updateToRevision, boolean isRecursive)
            throws SVNException {

        SVNUpdateClient updateClient = ourClientManager.getUpdateClient();
        /*
         * sets externals not to be ignored during the update
         */
        updateClient.setIgnoreExternals(false);
        /*
         * returns the number of the revision wcPath was updated to
         */
        return updateClient.doUpdate(wcPath, updateToRevision, isRecursive);
    }
    
    /*
     * Updates a working copy to a different URL. Like 'svn switch URL' command.
     * It's done by invoking 
     * 
     * SVNUpdateClient.doSwitch(File file, SVNURL url, SVNRevision revision, boolean recursive) 
     * 
     * which takes the following parameters:
     * 
     * file - a working copy entry that is to be switched to a new url;
     * 
     * url - a target URL a working copy is to be updated against;
     * 
     * revision - a revision to which a working copy is to be updated;
     * 
     * recursive - if true and an entry (file) is a directory then doSwitch(..) recursively 
     * switches the entire directory, otherwise - only child entries of the directory;   
     */
    public long switchToURL(File wcPath,
            SVNURL url, SVNRevision updateToRevision, boolean isRecursive)
            throws SVNException {
        SVNUpdateClient updateClient = ourClientManager.getUpdateClient();
        /*
         * sets externals not to be ignored during the switch
         */
        updateClient.setIgnoreExternals(false);
        /*
         * returns the number of the revision wcPath was updated to
         */
        return updateClient.doSwitch(wcPath, url, updateToRevision,
                isRecursive);
    }

    /*
     * Collects status information on local path(s). Like 'svn status (-u) (-N)' 
     * command. It's done by invoking 
     * 
     * SVNStatusClient.doStatus(File path, boolean recursive, 
     * boolean remote, boolean reportAll, boolean includeIgnored, 
     * boolean collectParentExternals, ISVNStatusHandler handler) 
     * 
     * which takes the following parameters:
     * 
     * path - an entry which status info to be gathered;
     * 
     * recursive - if true and an entry is a directory then doStatus(..) collects status 
     * info not only for that directory but for each item inside stepping down recursively;
     * 
     * remote - if true then doStatus(..) will cover the repository (not only the working copy)
     * as well to find out what entries are out of date;
     * 
     * reportAll - if true then doStatus(..) will also include unmodified entries;
     * 
     * includeIgnored - if true then doStatus(..) will also include entries being ignored; 
     * 
     * collectParentExternals - if true then externals definitions won't be ignored;
     * 
     * handler - an implementation of ISVNStatusHandler to process status info per each entry
     * doStatus(..) traverses; such info is collected in an SVNStatus object and
     * is passed to a handler's handleStatus(SVNStatus status) method where an implementor
     * decides what to do with it.  
     */
    public void showStatus(File wcPath, boolean isRecursive, boolean isRemote, boolean isReportAll,
            boolean isIncludeIgnored, boolean isCollectParentExternals)
            throws SVNException {
        /*
         * StatusHandler displays status information for each entry in the console (in the 
         * manner of the native Subversion command line client)
         */
        ourClientManager.getStatusClient().doStatus(wcPath, isRecursive, isRemote, isReportAll,
                isIncludeIgnored, isCollectParentExternals, new StatusHandler(isRemote));
    }

    /*
     * Collects information on local path(s). Like 'svn info (-R)' command.
     * It's done by invoking 
     * 
     * SVNWCClient.doInfo(File path, SVNRevision revision,
     * boolean recursive, ISVNInfoHandler handler) 
     * 
     * which takes the following parameters:
     * 
     * path - a local entry for which info will be collected;
     * 
     * revision - a revision of an entry which info is interested in; if it's not
     * WORKING then info is got from a repository;
     * 
     * recursive - if true and an entry is a directory then doInfo(..) collects info 
     * not only for that directory but for each item inside stepping down recursively;
     * 
     * handler - an implementation of ISVNInfoHandler to process info per each entry
     * doInfo(..) traverses; such info is collected in an SVNInfo object and
     * is passed to a handler's handleInfo(SVNInfo info) method where an implementor
     * decides what to do with it.     
     */
    public void showInfo(File wcPath, SVNRevision revision, boolean isRecursive) throws SVNException {
        /*
         * InfoHandler displays information for each entry in the console (in the manner of
         * the native Subversion command line client)
         */
        ourClientManager.getWCClient().doInfo(wcPath, revision, isRecursive, new InfoHandler());
    }
    
    /*
     * Puts directories and files under version control scheduling them for addition
     * to a repository. They will be added in a next commit. Like 'svn add PATH' 
     * command. It's done by invoking 
     * 
     * SVNWCClient.doAdd(File path, boolean force, 
     * boolean mkdir, boolean climbUnversionedParents, boolean recursive) 
     * 
     * which takes the following parameters:
     * 
     * path - an entry to be scheduled for addition;
     * 
     * force - set to true to force an addition of an entry anyway;
     * 
     * mkdir - if true doAdd(..) creates an empty directory at path and schedules
     * it for addition, like 'svn mkdir PATH' command;
     * 
     * climbUnversionedParents - if true and the parent of the entry to be scheduled
     * for addition is not under version control, then doAdd(..) automatically schedules
     * the parent for addition, too;
     * 
     * recursive - if true and an entry is a directory then doAdd(..) recursively 
     * schedules all its inner dir entries for addition as well. 
     */
    public void addEntry(File wcPath) throws SVNException {
        ourClientManager.getWCClient().doAdd(wcPath, false, false, false, true);
    }
    
    /*
     * Locks working copy paths, so that no other user can commit changes to them.
     * Like 'svn lock PATH' command. It's done by invoking 
     * 
     * SVNWCClient.doLock(File[] paths, boolean stealLock, String lockMessage) 
     * 
     * which takes the following parameters:
     * 
     * paths - an array of local entries to be locked;
     * 
     * stealLock - set to true to steal the lock from another user or working copy;
     * 
     * lockMessage - an optional lock comment string.
     */
    public void lock(File wcPath, boolean isStealLock, String lockComment) throws SVNException {
        ourClientManager.getWCClient().doLock(new File[] { wcPath }, isStealLock, lockComment);
    }
    
    /*
     * Schedules directories and files for deletion from version control upon the next
     * commit (locally). Like 'svn delete PATH' command. It's done by invoking 
     * 
     * SVNWCClient.doDelete(File path, boolean force, boolean dryRun) 
     * 
     * which takes the following parameters:
     * 
     * path - an entry to be scheduled for deletion;
     * 
     * force - a boolean flag which is set to true to force a deletion even if an entry
     * has local modifications;
     * 
     * dryRun - set to true not to delete an entry but to check if it can be deleted;
     * if false - then it's a deletion itself.  
     */
    public void delete(File wcPath, boolean force) throws SVNException {
        ourClientManager.getWCClient().doDelete(wcPath, force, false);
    }
    
    /*
     * Duplicates srcURL to dstURL (URL->URL)in a repository remembering history.
     * Like 'svn copy srcURL dstURL -m "some comment"' command. It's done by
     * invoking 
     * 
     * doCopy(SVNURL srcURL, SVNRevision srcRevision, SVNURL dstURL, 
     * boolean isMove, String commitMessage) 
     * 
     * which takes the following parameters:
     * 
     * srcURL - a source URL that is to be copied;
     * 
     * srcRevision - a definite revision of srcURL 
     * 
     * dstURL - a URL where srcURL will be copied; if srcURL & dstURL are both 
     * directories then there are two cases: 
     * a) dstURL already exists - then doCopy(..) will duplicate the entire source 
     * directory and put it inside dstURL (for example, 
     * consider srcURL = svn://localhost/rep/MyRepos, 
     * dstURL = svn://localhost/rep/MyReposCopy, in this case if doCopy(..) succeeds 
     * MyRepos will be in MyReposCopy - svn://localhost/rep/MyReposCopy/MyRepos); 
     * b) dstURL doesn't exist yet - then doCopy(..) will create a directory and
     * recursively copy entries from srcURL into dstURL (for example, consider the same
     * srcURL = svn://localhost/rep/MyRepos, dstURL = svn://localhost/rep/MyReposCopy, 
     * in this case if doCopy(..) succeeds MyRepos entries will be in MyReposCopy, like:
     * svn://localhost/rep/MyRepos/Dir1 -> svn://localhost/rep/MyReposCopy/Dir1...);  
     * 
     * isMove - if false then srcURL is only copied to dstURL what
     * corresponds to 'svn copy srcURL dstURL -m "some comment"'; but if it's true then
     * srcURL will be copied and deleted - 'svn move srcURL dstURL -m "some comment"'; 
     * 
     * commitMessage - a commit log message since URL->URL copying is immediately 
     * committed to a repository.
     */
    public SVNCommitInfo copy(SVNURL srcURL, SVNURL dstURL,
            boolean isMove, String commitMessage) throws SVNException {
        /*
         * SVNRevision.HEAD means the latest revision.
         * Returns SVNCommitInfo containing information on the new revision committed 
         * (revision number, etc.) 
         */
        //return ourClientManager.getCopyClient().doCopy(srcURL,  SVNRevision.HEAD,
        //        dstURL, isMove, commitMessage);
        
        SVNCopySource[] sources = {new SVNCopySource(null, null, srcURL)};
		return ourClientManager.getCopyClient().doCopy(sources , dstURL, isMove, false, true, commitMessage, null);
    }
    
    
    /*
     * Displays error information and exits. 
     */
    public static void error(String message, Exception e){
        System.err.println(message+(e!=null ? ": "+e.getMessage() : ""));
    }
    
    /*
     * This method does not relate to SVNKit API. Just a method which creates
     * local directories and files :)
     */
    private static final void createLocalDir(File aNewDir, File[] localFiles, String[] fileContents){
        if (!aNewDir.mkdirs()) {
            error("failed to create a new directory '" + aNewDir.getAbsolutePath() + "'.", null);
        }
        for(int i=0; i < localFiles.length; i++){
	        File aNewFile = localFiles[i];
            try {
	            if (!aNewFile.createNewFile()) {
	                error("failed to create a new file '"
	                        + aNewFile.getAbsolutePath() + "'.", null);
	            }
	        } catch (IOException ioe) {
	            aNewFile.delete();
	            error("error while creating a new file '"
	                    + aNewFile.getAbsolutePath() + "'", ioe);
	        }
	
	        String contents = null;
	        if(i > fileContents.length-1){
	            continue;
	        }
            contents = fileContents[i];
	        
	        /*
	         * writing a text into the file
	         */
	        FileOutputStream fos = null;
	        try {
	            fos = new FileOutputStream(aNewFile);
	            fos.write(contents.getBytes());
	        } catch (FileNotFoundException fnfe) {
	            error("the file '" + aNewFile.getAbsolutePath() + "' is not found", fnfe);
	        } catch (IOException ioe) {
	            error("error while writing into the file '"
	                    + aNewFile.getAbsolutePath() + "'", ioe);
	        } finally {
	            if (fos != null) {
	                try {
	                    fos.close();
	                } catch (IOException ioe) {
	                    //
	                }
	            }
	        }
        }
    }

    
}
