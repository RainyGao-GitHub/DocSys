package util.SvnUtil;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.tmatesoft.svn.core.SVNCommitInfo;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNLogEntry;
import org.tmatesoft.svn.core.SVNLogEntryPath;
import org.tmatesoft.svn.core.SVNNodeKind;
import org.tmatesoft.svn.core.SVNProperties;
import org.tmatesoft.svn.core.SVNProperty;
import org.tmatesoft.svn.core.SVNURL;
import org.tmatesoft.svn.core.auth.ISVNAuthenticationManager;
import org.tmatesoft.svn.core.internal.io.dav.DAVRepositoryFactory;
import org.tmatesoft.svn.core.internal.io.fs.FSRepositoryFactory;
import org.tmatesoft.svn.core.internal.io.svn.SVNRepositoryFactoryImpl;
import org.tmatesoft.svn.core.io.ISVNEditor;
import org.tmatesoft.svn.core.io.SVNRepository;
import org.tmatesoft.svn.core.io.SVNRepositoryFactory;
import org.tmatesoft.svn.core.io.diff.SVNDeltaGenerator;
import org.tmatesoft.svn.core.wc.SVNWCUtil;

import com.DocSystem.common.CommitAction;
import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;

public class SVNUtil  extends BaseController{
	
	//For Low Level APIs
	private SVNRepository repository = null;
	private SVNURL repositoryURL = null;

	/***
     * SVNUtil初始化方法：需要指定此次操作的SVN路径、用户名和密码
     * @param reposURL
     * @param userName
     * @param password
     */
    @SuppressWarnings("deprecation")
	public boolean Init(Repos repos,boolean isRealDoc,String commitUser)
    {
    	String reposURL = null;
    	String svnUser = null;
    	String svnPwd = null;
    
    	if(isRealDoc)
    	{
    		Integer isRemote = repos.getIsRemote();
    		if(isRemote == 1)
    		{
    			reposURL = repos.getSvnPath();
    			svnUser = repos.getSvnUser();
    			svnPwd = repos.getSvnPwd();
    		}
    		else
    		{
    			reposURL = getLocalVerReposURI(repos,isRealDoc);
    		}
    	}
    	else
    	{
    		Integer isRemote1 = repos.getIsRemote1();
    		if(isRemote1 == 1)
    		{
    			reposURL = repos.getSvnPath1();
    			svnUser = repos.getSvnUser1();
    			svnPwd = repos.getSvnPwd1();
    		}
    		else
    		{
    			reposURL = getLocalVerReposURI(repos,isRealDoc);
    		}
    	}

		
		if(svnUser==null || "".equals(svnUser))
		{
			svnUser = commitUser;
		}

		
    	//根据不同协议，初始化不同的仓库工厂。(工厂实现基于SVNRepositoryFactory抽象类)
        setupLibrary();
           	
        //转换 url From String to SVNURL
        try {
        	repositoryURL = SVNURL.parseURIEncoded(reposURL);
        } catch (Exception e) {
			System.out.println("Init() parseURIEncoded " + reposURL + " Failed");
            e.printStackTrace();
            return false;
        }

        //It is for low level API calls，注意后面的High Level接口实际上也会创建一个仓库驱动
        //创建一个仓库驱动并设置权限验证对象
        try {
			repository = SVNRepositoryFactory.create(repositoryURL);
		} catch (SVNException e) {
			System.out.println("Init() create " + repositoryURL.toString() + " Failed");
			e.printStackTrace();
			return false;
		}
        //设置权限验证对象
        ISVNAuthenticationManager authManager = SVNWCUtil.createDefaultAuthenticationManager(svnUser, svnPwd);
        repository.setAuthenticationManager(authManager);
        
        return true;
    }
    
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
    
    /*************** Rainy Added Interfaces Based on Low Level APIs Start **************/
	public Doc getDoc(String filePath, String revision) 
	{
    	//System.out.println("getDoc() filePath:" + filePath);
    	if(filePath == null)
    	{
        	System.out.println("getDoc() 非法参数：filePath is null");
        	return null;
    	}
    	
    	long startRevision = -1;
    	long endRevision = -1;
    	
        try {
	    	if(revision == null)
	    	{
	    		startRevision = endRevision = repository.getLatestRevision();
	    	}
	    	else
	    	{
	    		startRevision = endRevision = Long.parseLong(revision);
	    	}
	    	
	    	if(repository.checkPath(filePath, startRevision) ==  SVNNodeKind.NONE) 
			{
	        	return null;
			}
	    		    	
	        String[] targetPaths = new String[]{filePath};
	        Collection<SVNLogEntry> logEntries = null;
 
			logEntries = repository.log(targetPaths, null,startRevision, endRevision, true, true);

	        for (Iterator<SVNLogEntry> entries = logEntries.iterator(); entries.hasNext();) 
	        {
	            SVNLogEntry logEntry = (SVNLogEntry) entries.next();
	            revision = logEntry.getRevision() + "";
	            String commitUser = logEntry.getAuthor(); //提交者
	            long commitTime = logEntry.getDate().getTime();
	            
	            Doc doc = new Doc();
	            doc.setRevision(revision);
	            doc.setLatestEditorName(commitUser);
	            doc.setLatestEditTime(commitTime);
	            return doc;
	        }
	        return null;       
		} catch (SVNException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
	}
    
    //getHistory filePath: remote File Path under repositoryURL
	public List<LogEntry> getHistoryLogs(String filePath,long startRevision, long endRevision, int maxLogNum) 
    {
    	System.out.println("getHistoryLogs filePath:" + filePath);	
    	if(filePath == null)
    	{
        	System.out.println("getHistoryLogs() 非法参数：filePath is null");
        	return null;
    	}
    	
    	List<LogEntry> logList = new ArrayList<LogEntry>();
        
    	/*
         * Gets the latest revision number of the repository
         */
        if(endRevision < 0)
    	{
        	try {
	    	    endRevision = repository.getLatestRevision();
	        } catch (SVNException svne) {
	            System.err.println("error while fetching the latest repository revision: " + svne.getMessage());
	            return null;
	        }
    	}

        /*
         * Get History Info
         */
        String[] targetPaths = new String[]{filePath};
        Collection<SVNLogEntry> logEntries = null;
        try {
        	if(maxLogNum > 0)
        	{
        		if((endRevision - startRevision) > maxLogNum)
        		{
        			startRevision = endRevision - maxLogNum;
        		}
        	}
            logEntries = repository.log(targetPaths, null,startRevision, endRevision, true, true);
        } catch (SVNException svne) {
            System.out.println("error while collecting log information for '" + repositoryURL + "': " + svne.getMessage());
            return null;
        }
        
        for (Iterator<SVNLogEntry> entries = logEntries.iterator(); entries.hasNext();) {
            /*
             * gets a next SVNLogEntry
             */
            SVNLogEntry logEntry = (SVNLogEntry) entries.next();
            long revision = logEntry.getRevision();
            String commitId = "" + revision;
            String commitUser = logEntry.getAuthor(); //提交者
            String commitMessage= logEntry.getMessage();
            long commitTime = logEntry.getDate().getTime();            
            
            //System.out.println("revision:"+revision);
            //System.out.println("commitId:"+commitId);
            //System.out.println("commitUser:"+commitUser);
            //System.out.println("commitMessage:"+commitMessage);
            //System.out.println("commitName:"+commitUser);
            //System.out.println("commitTime:"+commitTime);
            
            LogEntry log = new LogEntry();
            log.setRevision(revision);
            log.setCommitId(commitId);
            log.setCommitUser(commitUser);
            log.setCommitMsg(commitMessage);
            log.setCommitTime(commitTime);
            
            //displaying all paths that were changed in that revision; changed path information is represented by SVNLogEntryPath.
            if(logEntry.getChangedPaths().size() > 0) 
            {
            	List<ChangedItem> changedItemList = new ArrayList<ChangedItem>();
                
            	//System.out.println();
                //System.out.println("changed Entries:");
                //keys are changed paths
                Set<String> changedPathsSet = logEntry.getChangedPaths().keySet();
                for (Iterator<String> changedPaths = changedPathsSet.iterator(); changedPaths.hasNext();) 
                {
                	//obtains a next SVNLogEntryPath
                    SVNLogEntryPath entryPath = (SVNLogEntryPath) logEntry.getChangedPaths().get(changedPaths.next());
                    String nodePath = entryPath.getPath();
                    String nodeKind = entryPath.getKind().toString();
                    String changeType = "" + entryPath.getType();
                    String copyPath = entryPath.getCopyPath();
                    long copyRevision = entryPath.getCopyRevision();
                    
                    //System.out.println(" " + changeType + "	" + nodePath + ((copyPath != null) ? " (from " + copyPath + " revision " + copyRevision + ")" : ""));                 

                    //Add to changedItemList
                    ChangedItem changedItem = new ChangedItem();
                    changedItem.setChangeType(changeType);	
                    changedItem.setPath(nodePath);
                    changedItem.setKind(nodeKind);
                    changedItem.setCopyPath(copyPath);
                    changedItem.setCopyRevision(copyRevision);
                    changedItemList.add(changedItem);
                }
                log.setChangedItems(changedItemList);
            }
            logList.add(0,log);	//add to the top
        }
        return logList;
    }
    
    //FSFS格式SVN仓库创建接口
	public static String CreateRepos(String name,String path){
		System.out.println("CreateRepos reposName:" + name + "under Path:" + path);
    	if(path == null || name == null)
    	{
        	System.out.println("CreateRepos() 非法参数：path or name is null");
        	return null;
    	}
    	
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
	public boolean doCheckPath(String remoteFilePath,long revision)
	{
    	if(remoteFilePath == null)
    	{
        	System.out.println("doCheckPath() 非法参数：remoteFilePath is null");
        	return false;
    	}
    	
		SVNNodeKind nodeKind;
		try {
			nodeKind = repository.checkPath(remoteFilePath, revision);
			if(nodeKind == SVNNodeKind.NONE) 
			{
				return false;
			}
		} catch (Exception e) {
			System.out.println("doCheckPath() Exception");
			e.printStackTrace();
			return false;
		}
		return true;
	}
	
	public int getEntryType(String remoteEntryPath, long revision) 
	{
    	if(remoteEntryPath == null)
    	{
        	System.out.println("getEntryType() 非法参数：remoteEntryPath is null");
        	return -1;
    	}
		
		SVNNodeKind nodeKind = null;
		try {
			nodeKind = repository.checkPath(remoteEntryPath, revision);
		} catch (SVNException e) {
			System.out.println("getEntryType() checkPath Error:" + remoteEntryPath);
			e.printStackTrace();
			return -1;
		}
		
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
	
	//将远程目录同步成本地目录的结构：
	//1、遍历远程目录：将远程多出来的文件和目录删除
	//2、遍历本地目录：将本地多出来的文件或目录添加到远程
	//localPath是需要自动commit的目录
	//modifyEnable: 表示是否commit已经存在的文件
	//refLocalPath是存放参考文件的目录，如果对应文件存在且modifyEnable=true的话，则增量commit
	public String doAutoCommit(String parentPath, String entryName,String localParentPath,String commitMsg,String commitUser, boolean modifyEnable,String localRefParentPath){
		System.out.println("doAutoCommit()" + " parentPath:" + parentPath +" entryName:" + entryName +" localParentPath:" + localParentPath + " commitMsg:" + commitMsg +" modifyEnable:" + modifyEnable + " localRefParentPath:" + localRefParentPath);	
    	if(parentPath == null || entryName == null)
    	{
        	System.out.println("doAutoCommit() 非法参数：parentPath or entryName is null");
        	return null;
    	}
    	
		File wcDir = new File(localParentPath);
		if(!wcDir.exists())
		{
			System.out.println("doAutoCommit() localParentPath " + localParentPath + " not exists");
			return null;
		}
		
		if(!wcDir.isDirectory())
		{
			System.out.println("doAutoCommit() localParentPath " + localParentPath + " is not directory");
			return null;
		}

		
		try {
	
			String entryPath = parentPath + entryName;
			
			File localEntry = new File(localParentPath + entryName);
			//LocalEntry does not exist
			if(!localEntry.exists())	//Delete Commit
			{
		        SVNNodeKind nodeKind = repository.checkPath(entryPath, -1);
		        if (nodeKind == SVNNodeKind.NONE) 
		        {
		        	return repository.getLatestRevision()+"";
		        }
		        //Do delete remote Entry
		        return svnDelete(parentPath, entryName, commitMsg, commitUser);
			}

			//LocalEntry is File
			if(!localEntry.isDirectory())
			{
		        SVNNodeKind nodeKind = repository.checkPath(entryPath, -1);
		        if (nodeKind == SVNNodeKind.NONE) 
		        {
		        	return svnAddFileEx(parentPath, entryName, localParentPath, commitMsg, commitUser, false);
		        }
		        else if(nodeKind != SVNNodeKind.FILE)
		        {
		         	return svnAddFileEx(parentPath, entryName, localParentPath, commitMsg, commitUser, true);
		        }
		        else
		        {
		        	return svnModifyFile(parentPath, entryName, null, localParentPath+entryName, commitMsg, commitUser);
		        }
			}

			//LocalEntry is Directory
			List <CommitAction> commitActionList = new ArrayList<CommitAction>();
	        SVNNodeKind nodeKind = repository.checkPath(entryPath, -1);
	        if (nodeKind == SVNNodeKind.NONE) 
	        {
	        	System.out.println(entryPath + " 不存在");
	        	System.out.println("doAutoCommit() scheduleForAddAndModify Start");
		        scheduleForAddAndModify(commitActionList,parentPath,entryName,localParentPath,localRefParentPath,modifyEnable,false);
		        
		        if(!parentPath.isEmpty())
		        {
		        	insertAddActionForParentPath(commitActionList, parentPath);
		        }   
	        } 
	        else if (nodeKind == SVNNodeKind.FILE) 
	        {
	        	System.out.println(entryPath + " is File");
				insertDeleteAction(commitActionList,parentPath, entryName);
	        	scheduleForAddAndModify(commitActionList,parentPath,entryName,localParentPath,localRefParentPath,modifyEnable,false);
	        }
	        else
	        {
	        	System.out.println("doAutoCommit() scheduleForDelete Start");
	        	scheduleForDelete(commitActionList,localParentPath,parentPath,entryName);
		        System.out.println("doAutoCommit() scheduleForAddAndModify Start");
			    scheduleForAddAndModify(commitActionList,parentPath,entryName,localParentPath,localRefParentPath,modifyEnable,false);
	        }
	                
	        if(commitActionList == null || commitActionList.size() ==0)
	        {
	        	System.out.println("doAutoCommmit() There is nothing to commit");
	        	return repository.getLatestRevision() + "";
	        }
	        ISVNEditor editor = getCommitEditor(commitMsg);
	        if(editor == null)
	        {
	        	System.out.println("doAutoCommit() getCommitEditor Failed");
	        	return null;
	        }
	        
	        if(executeCommitActionList(editor,commitActionList,true) == false)
	        {
	        	System.out.println("doAutoCommit() executeCommitActionList Failed");
	        	editor.abortEdit();	
	        	return null;
	        }
	        
	        SVNCommitInfo commitInfo = commit(editor);
	        if(commitInfo == null)
	        {
	        	System.out.println("doAutoCommit() commit failed: " + commitInfo);
	        	return null;
	        }
	        System.out.println("doAutoCommit() commit success: " + commitInfo);
	        return commitInfo.getNewRevision()+"";
		} catch (Exception e) {
			System.out.println("doAutoCommit() Exception");
			e.printStackTrace();
			return null;
		}
	}
    
    private void insertAddActionForParentPath(List<CommitAction> commitActionList, String parentPath) 
    {
        System.out.println("insertAddActionForParentPath() parentPath:" + parentPath);
    	if(parentPath == null || parentPath.isEmpty())
    	{
    		return;
    	}
    	
    	String [] paths = parentPath.split("/");
    	
    	boolean isSubAction = true;	//fist Add will not be subAction
    	String path = "";
    	String name = "";
    	CommitAction curAction = null;
    	CommitAction topAction = null;
    	try {
	    	for(int i=0; i< paths.length; i++)
	    	{
	    		if(paths[i].isEmpty())
	    		{
	    			continue;
	    		}
	    		
	    		name = paths[i];
	    		if(SVNNodeKind.NONE == repository.checkPath(path+name, -1))
	    		{
		    		CommitAction action = new CommitAction();
	    	    	action.setAction(1);
	    	    	action.setEntryType(2);
	    	    	action.setParentPath(path);
	    	    	action.setEntryName(name);
	    	    	action.isSubAction = isSubAction;
	    	    	action.hasSubList = true;
	    	    	
	    			//Build commitAction
	    	    	if(isSubAction == false)
	    	    	{
		    	    	isSubAction = true;
		    	    	topAction = action;
		    	    	curAction = action;    
	    	    	}
	    	    	else
	    	    	{
	    	    		//For subAction need to add to subActionList then add to curAction
	    	    		List<CommitAction> subActionList = new ArrayList<CommitAction>();
	    	    		subActionList.add(action);
	    	    		curAction.setSubActionList(subActionList);
	    	    		curAction = action;
	    	    	}
	    		}
	    	}
	    	
	    	if(topAction == null)
	    	{
	    		System.out.println("insertAddActionForParentPath() topAction is null");
	    		return; 
	    	}
	    	
	    	//Update the commitActionList
	    	List<CommitAction> tempSubActionList = new ArrayList<CommitAction>();
	    	CommitAction tempTopAction = commitActionList.get(0);
	    	tempTopAction.isSubAction = true;
	    	tempSubActionList.add(tempTopAction);
	    	
	    	curAction.setSubActionList(tempSubActionList);
	    	commitActionList.set(0, topAction);
    	} catch (Exception e) {
    		System.out.println("insertAddActionForParentPath() Exception");
    		e.printStackTrace();
    	}
	}

	private boolean executeCommitActionList(ISVNEditor editor,List<CommitAction> commitActionList,boolean openRoot) {
    	System.out.println("executeCommitActionList() szie: " + commitActionList.size());
		try {
	    	if(openRoot)
	    	{
				editor.openRoot(-1);
			}
	    	for(int i=0;i<commitActionList.size();i++)
	    	{
	    		CommitAction action = commitActionList.get(i);
	    		boolean ret = false;
	    		switch(action.getAction())
	    		{
	    		case 1:	//add
	        		ret = executeAddAction(editor,action);
	    			break;
	    		case 2: //delete
	    			ret = executeDeleteAction(editor,action);
	    			break;
	    		case 3: //modify
	    			ret = executeModifyAction(editor,action);
	        		break;
	    		}
	    		if(ret == false)
	    		{
	    			System.out.println("executeCommitActionList() failed");	
	    			return false;
	    		} 
	    	}
	    	
	    	if(openRoot)
	    	{
	    		editor.closeDir();
	    	}
	
	    	return true;
		} catch (SVNException e) {
			System.out.println("executeCommitActionList() 异常");	
			e.printStackTrace();
			return false;
		}
	}

	private boolean executeModifyAction(ISVNEditor editor, CommitAction action) {
		String parentPath = action.getParentPath();
		String entryName = action.getEntryName();
		String localPath = action.getLocalRootPath();
		String localRefPath = action.getLocalRefRootPath();
		System.out.println("executeModifyAction() parentPath:" + parentPath + " entryName:" + entryName + " localPath:" + localPath + " localRefPath:" + localRefPath);
		
		InputStream oldData = null;
		if(localRefPath != null)
		{
			oldData = getFileInputStream(localRefPath + entryName);
		}
		InputStream newData = getFileInputStream(localPath + entryName);
    	boolean ret = false;
		if(action.isSubAction)
		{
			//subAction no need to openRoot and Parent
			ret = modifyFile(editor,parentPath, entryName, oldData, newData,false,false);
		}
		else
		{
   			ret = modifyFile(editor,parentPath, entryName, oldData, newData,false,true);       			
		}
		if(oldData != null)
		{
			closeFileInputStream(oldData);
		}
		closeFileInputStream(newData);
		return ret;
	}

	private boolean executeDeleteAction(ISVNEditor editor, CommitAction action) {
		String parentPath = action.getParentPath();
		String entryName = action.getEntryName();
		String localPath = action.getLocalRootPath();
		String localRefPath = action.getLocalRefRootPath();
		System.out.println("executeDeleteAction() parentPath:" + parentPath + " entryName:" + entryName + " localPath:" + localPath + " localRefPath:" + localRefPath);
		return deleteEntry(editor,parentPath, entryName,false);
	}

	private boolean executeAddAction(ISVNEditor editor, CommitAction action) {
		Integer entryType = action.getEntryType();
		String parentPath = action.getParentPath();
		String entryName = action.getEntryName();
		String localPath = action.getLocalRootPath();
		String localRefPath = action.getLocalRefRootPath();
		System.out.println("executeAddAction() parentPath:" + parentPath + " entryName:" + entryName + " localPath:" + localPath + " localRefPath:" + localRefPath);

		if(entryType == 1)	//File
    	{
    		String localEntryPath = localPath + entryName;
    		if(parentPath == null)
    		{
    			localEntryPath = entryName;
    		}
    		
    		InputStream fileData = getFileInputStream(localEntryPath);
    		boolean ret = false;
    		if(action.isSubAction)
    		{
    			//No need to openParent
    			ret = addEntry(editor, parentPath, entryName, true, fileData, false, false, false);
    		}
    		else
    		{	
    			ret = addEntry(editor, parentPath, entryName, true, fileData, false, true, false);
    		}
    		closeFileInputStream(fileData);
    		return ret;
    	}
		
		//If entry is Dir we need to check if it have subActionList
    	if(action.isSubAction)	//No need to open the Root and Parent
    	{
    		if(action.hasSubList == false)	
    		{
    			return addEntry(editor, parentPath, entryName, false, null, false, false, false);
    		}
    		else //Keep the added Dir open until the subActionLis was executed
    		{	
    			if(addEntry(editor, parentPath, entryName, false, null, false, false, true) == false)
    			{
    				return false;
    			}
    			
    			if(executeCommitActionList(editor, action.getSubActionList(),false) == false)
    			{
    				return false;
    			}
    				
    			//close the added Dir
    			try {
					editor.closeDir();
				} catch (SVNException e) {
					System.out.println("executeAddAction() closeDir failed");
					e.printStackTrace();
					return false;
				}
    			return true;
    		}
    	}
    	else	//need to open the root and parent
    	{
    		if(action.hasSubList == false)	
    		{
    			return addDir(editor, parentPath, entryName);
    		}
    		else //Keep the added Dir open until the subActionLis was executed
    		{	
    			//close the added Dir
    			try {
	    			editor.openDir(parentPath,-1);
	    			
	    			if(addEntry(editor, parentPath, entryName, false, null, false, false, true) == false)
	    			{
	    				return false;
	    			}
	    			
	    			if(executeCommitActionList(editor, action.getSubActionList(),false) == false)
	    			{
	    				return false;
	    			}
    				
					editor.closeDir();	//close new add Dir
					editor.closeDir();	//close parent
				} catch (SVNException e) {
					System.out.println("executeAddAction() closeDir failed");
					e.printStackTrace();
					return false;
				}
    			return true;
    		}
    	}
	}


	public boolean scheduleForDelete(List<CommitAction> actionList, String localPath,String parentPath, String entryName)
	{
		//System.out.println("scheduleForDelete()" + " parentPath:" + parentPath + " entryName:" + entryName + " localPath:" + localPath);

		//遍历仓库所有子目录
		try {
	        if(entryName.isEmpty())	//If the entryName is empty, means we need to go through the subNodes directly
	        {
    			Collection entries;
    			entries = repository.getDir(parentPath, -1, null,(Collection) null);
    	        Iterator iterator = entries.iterator();
    	        while (iterator.hasNext()) 
    	        {
    	            SVNDirEntry entry = (SVNDirEntry) iterator.next();
    	            String subEntryName = entry.getName();
       	    	    scheduleForDelete(actionList,localPath, parentPath,subEntryName);
    	        }   
	        }
	        else
	        {
	            String remoteEntryPath = parentPath + entryName;            
	            String localEntryPath = localPath + entryName;
	
	            File localEntry = new File(localEntryPath);
	            
				SVNNodeKind entryKind = repository.checkPath(remoteEntryPath, -1);
	            if(entryKind == SVNNodeKind.FILE)
	            {
	            	if(!localEntry.exists() || localEntry.isDirectory())	//本地文件不存在或者类型不符，则删除该文件
	                {
	                    System.out.println("scheduleForDelete() insert " + remoteEntryPath + " to actionList for Delete");
	                    //deleteEntry(editor,entryPath);
	                    insertDeleteAction(actionList,parentPath,entryName);
	                }
	            }
	            else if(entryKind == SVNNodeKind.DIR) 
	            {
	            	if(!localEntry.exists() || localEntry.isFile())	//本地目录不存在或者类型不符，则删除该目录
	                {
	                    System.out.println("scheduleForDelete() insert " + remoteEntryPath + " to actionList for Delete");
	                    insertDeleteAction(actionList,parentPath,entryName);
	                }
	           	    else	//If it is dir, go through the subNodes for delete
	           	    {
	        			Collection entries;
	        			entries = repository.getDir(remoteEntryPath, -1, null,(Collection) null);
	        	        Iterator iterator = entries.iterator();
	        	        while (iterator.hasNext()) 
	        	        {
	        	            SVNDirEntry entry = (SVNDirEntry) iterator.next();
	        	            String subEntryName = entry.getName();
	           	    	    scheduleForDelete(actionList,localEntryPath+"/", remoteEntryPath+"/",subEntryName);
	        	        }   
	           	    }
	            }
	        }
		} catch (SVNException e) {
			System.out.println("scheduleForDelete() Exception");
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public void scheduleForAddAndModify(List<CommitAction> actionList, String parentPath, String entryName,String localPath, String localRefPath,boolean modifyEnable,boolean isSubAction) throws SVNException {
    	//System.out.println("scheduleForAddAndModify()  parentPath:" + parentPath + " entryName:" + entryName + " localPath:" + localPath + " localRefPath:" + localRefPath);

    	if(entryName.isEmpty())	//Go through the sub files for add and modify
    	{
    		File localEntry = new File(localPath);
    		File[] tmp=localEntry.listFiles();
    		for(int i=0;i<tmp.length;i++)
    		{
    			String subEntryName = tmp[i].getName();
    			scheduleForAddAndModify(actionList,parentPath, subEntryName, localPath, localRefPath,modifyEnable, false);
            }
    		return;
    	}
    	else
    	{
	    	String remoteEntryPath = parentPath + entryName;
	    	String localEntryPath = localPath + entryName;

	    	String localRefEntryPath = localRefPath + entryName;
	    	if(localRefPath == null)
	    	{
	    		localRefEntryPath = null;
	    	}
	    	
	    	File localEntry = new File(localEntryPath);
	    	if(localEntry.exists())
	        {
	        	SVNNodeKind nodeKind = repository.checkPath(remoteEntryPath, -1);
	        	
	        	if(localEntry.isDirectory())	//IF the entry is dir and need to add, we need to get the subActionList Firstly
	        	{
	        		
	        		String subParentPath = remoteEntryPath + "/";
		    		String subLocalPath = localEntryPath + "/";
		    		String subLocalRefPath = localRefEntryPath + "/";
		    		if(localRefEntryPath == null)
		    		{
		    			subLocalRefPath = null;
		    		}
		    		
	    	        //If Remote path not exist
	        		if (nodeKind == SVNNodeKind.NONE) {
		            	System.out.println("scheduleForAddAndModify() insert " + remoteEntryPath + " to actionList for Add" );
		            	
		            	//Go through the sub files to Get the subActionList
			    		File[] tmp=localEntry.listFiles();
			    		List<CommitAction> subActionList = new ArrayList<CommitAction>();
			        	for(int i=0;i<tmp.length;i++)
			        	{
			        		String subEntryName = tmp[i].getName();
			        		scheduleForAddAndModify(subActionList,subParentPath, subEntryName,subLocalPath, subLocalRefPath,modifyEnable, true);
			            }
			        	
			        	//Insert the DirAdd Action
			        	insertAddDirAction(actionList,parentPath,entryName,isSubAction,true,subActionList);
			        	return;
		            }
	        		else
	        		{
	        			//Go through the sub Files For Add and Modify
	        			File[] tmp=localEntry.listFiles();
	        			for(int i=0;i<tmp.length;i++)
	        			{
	        				String subEntryName = tmp[i].getName();
		        			scheduleForAddAndModify(actionList,subParentPath, subEntryName, subLocalPath, subLocalRefPath,modifyEnable, false);        				
		        		}
	        			return;
		            }
	        	}
	        	else	//If the entry is file, do insert
            	{
            		if (nodeKind == SVNNodeKind.NONE) {
    	            	System.out.println("scheduleForAddAndModify() insert " + remoteEntryPath + " to actionList for Add" );
    	            	insertAddFileAction(actionList,parentPath, entryName,localPath,isSubAction);
    	            	return;
    	            }
            		
		            if(modifyEnable)
		            {
	            		//版本仓库文件已存在也暂时不处理，除非能够判断出两者不一致
	            		System.out.println("scheduleForAddAndModify() insert " + remoteEntryPath + " to actionList for Modify" );
	            		insertModifyFile(actionList,parentPath, entryName, localPath, localRefPath);
	            		return;
	            	}	
            	}
	       }
    	}
	}

	private InputStream getFileInputStream(String filePath) {
		//检查文件路径
		if(filePath == null || "".equals(filePath))
		{
			System.out.println("getFileInputStream(): filePath is empty");
			return null;
		}
		
		//检查文件是否存在
		File file = new File(filePath);  
		if(file.exists() == false)
		{
			System.out.println("getFileInputStream(): 文件 " + filePath + " 不存在");
			return null;
		}
		
		FileInputStream fileInputStream = null;
		try {
			fileInputStream = new FileInputStream(file);
		} catch (FileNotFoundException e) {
			System.out.println("getFileInputStream(): fileInputStream is null for " + filePath);
			e.printStackTrace();
			return null;
		}  
		return fileInputStream;
	}
	

	private boolean closeFileInputStream(InputStream fileData) {
		try {
			fileData.close();
		} catch (Exception e) {
			System.out.println("closeFileInputStream() close failed");
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public byte[] remoteGetFile(String filePath,long revision)
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
	            SVNNodeKind nodeKind = repository.checkPath(filePath,revision);
	            
	            if (nodeKind == SVNNodeKind.NONE) {
	                System.err.println("There is no entry at '" + repositoryURL + "'.");
	                return null;
	            } else if (nodeKind == SVNNodeKind.DIR) {
	                System.err.println("The entry at '" + repositoryURL + "' is a directory while a file was expected.");
	                return null;
	            }
	            /*
	             * Gets the contents and properties of the file located at filePath
	             * in the repository at the latest revision (which is meant by a
	             * negative revision number).
	             */
	            repository.getFile(filePath, revision, fileProperties, baos);

	        } catch (SVNException svne) {
	            System.err.println("error while fetching the file contents and properties: " + svne.getMessage());
	            return null;
	        }
	        return baos.toByteArray();
	}	
	
    //增加目录
	public boolean svnAddDir(String parentPath,String entryName,String commitMsg, String commitUser)
	{
        ISVNEditor editor = getCommitEditor(commitMsg);
		if(editor == null)
		{
			return false;
		}
		
		if(addDir(editor, parentPath, entryName) == false)
		{
			return false;
		}
		
		SVNCommitInfo commitInfo = commit(editor);
		if(commitInfo == null)
		{
			return false;
		}
		
		System.out.println("svnAddDir() The directory was added: " + commitInfo);
		return true;
	}
	
	//增加文件
	public boolean svnAddFile(String parentPath,String entryName,String localFilePath,String commitMsg, String commitUser)
	{
        ISVNEditor editor = getCommitEditor(commitMsg);
		if(editor == null)
		{
			return false;
		}	
	    
		InputStream localFile = getFileInputStream(localFilePath);
		boolean ret = addFile(editor, parentPath,entryName, localFile);
		closeFileInputStream(localFile);
		if(ret == false)
		{
			return false;
		}	
		
		SVNCommitInfo commitInfo = commit(editor);
		if(commitInfo == null)
		{
			return false;
		}

		System.out.println("svnAddFile() The file was added: " + commitInfo);
		return true;
	}
	
	
	//增加目录（如果parentPath不存在则也会增加）
	public boolean svnAddDirEx(String parentPath,String entryName,String localPath,String commitMsg, String commitUser, boolean deleteOld)
	{
		System.out.println("svnAddFileEx()" + " parentPath:" + parentPath +" entryName:" + entryName +" localPath:" + localPath);	
		try {
			//Build commitAction
			List <CommitAction> commitActionList = new ArrayList<CommitAction>();
			
			if(deleteOld)		
			{
				insertDeleteAction(commitActionList,parentPath, entryName);
				insertAddDirAction(commitActionList,parentPath, entryName, false, false, null);
			}
			else
			{
				insertAddDirAction(commitActionList,parentPath, entryName, false, false, null);
			
				if(!parentPath.isEmpty())
				{
					insertAddActionForParentPath(commitActionList, parentPath);
				}
			}
			
		    if(commitActionList == null || commitActionList.size() ==0)
		    {
		    	System.out.println("svnAddFileEx() There is nothing to commit");
		        return true;
		    }
	        
		    ISVNEditor editor = getCommitEditor(commitMsg);
	        if(editor == null)
	        {
	        	System.out.println("svnAddFileEx() getCommitEditor Failed");
	        	return false;
	        }
	        
	        if(executeCommitActionList(editor,commitActionList,true) == false)
	        {
	        	System.out.println("svnAddFileEx() executeCommitActionList Failed");
	        	editor.abortEdit();	
	        	return false;
	        }
		        
		    SVNCommitInfo commitInfo = commit(editor);
		    if(commitInfo == null)
		    {
		    	System.out.println("svnAddFileEx() commit failed!");
		    	return false;
		    }
		    
		    System.out.println("svnAddFileEx() commit success: " + commitInfo);
		    
		} catch (Exception e) {
			System.out.println("doAutoCommit() Exception");
			e.printStackTrace();
			return false;
		}
		return true;
	}

	//增加文件（如果parentPath不存在则也会增加）
	public String svnAddFileEx(String parentPath,String entryName,String localParentPath,String commitMsg, String commitUser, boolean deleteOld)
	{
		System.out.println("svnAddFileEx()" + " parentPath:" + parentPath +" entryName:" + entryName +" localParentPath:" + localParentPath);	
		try {
			//Build commitAction
			List <CommitAction> commitActionList = new ArrayList<CommitAction>();
			
			if(deleteOld)		
			{
				insertDeleteAction(commitActionList,parentPath, entryName);
				insertAddFileAction(commitActionList,parentPath, entryName,localParentPath,false);
			}
			else
			{
				insertAddFileAction(commitActionList,parentPath, entryName,localParentPath,false);
				
				if(!parentPath.isEmpty())
				{
					insertAddActionForParentPath(commitActionList, parentPath);
				}
			}
			
		    if(commitActionList == null || commitActionList.size() ==0)
		    {
		    	System.out.println("svnAddFileEx() There is nothing to commit");
		        return "";
		    }
	        
		    ISVNEditor editor = getCommitEditor(commitMsg);
	        if(editor == null)
	        {
	        	System.out.println("svnAddFileEx() getCommitEditor Failed");
	        	return null;
	        }
	        
	        if(executeCommitActionList(editor,commitActionList,true) == false)
	        {
	        	System.out.println("svnAddFileEx() executeCommitActionList Failed");
	        	editor.abortEdit();	
	        	return null;
	        }
		        
		    SVNCommitInfo commitInfo = commit(editor);
		    if(commitInfo == null)
		    {
		    	System.out.println("svnAddFileEx() commit failed!");
		    	return null;
		    }
		    
		    System.out.println("svnAddFileEx() commit success: " + commitInfo);
			return commitInfo.getNewRevision() + "";		    
		} catch (Exception e) {
			System.out.println("doAutoCommit() Exception");
			e.printStackTrace();
			return null;
		}
	}
	
	//修改文件
	public String svnModifyFile(String parentPath,String entryName,String oldFilePath,String newFilePath,String commitMsg, String commitUser)
	{
		System.out.println("svnModifyFile() parentPath:"+parentPath + " entryName:" + entryName);
        ISVNEditor editor = getCommitEditor(commitMsg);
		if(editor == null)
		{
			return null;
		}	
	    
		boolean ret = false;
		InputStream newFile = getFileInputStream(newFilePath);
		
		if(oldFilePath != null)
		{
			InputStream oldFile = null;
			File file = new File(oldFilePath);
			if(true == file.exists())
			{
				oldFile = getFileInputStream(oldFilePath);	
				ret = modifyFile(editor, parentPath,entryName, oldFile, newFile,true,true);
				closeFileInputStream(oldFile);
			}
			else
			{
				ret = modifyFile(editor, parentPath,entryName, null, newFile,true,true);
			}
		}
		else
		{
			ret = modifyFile(editor, parentPath,entryName, null, newFile,true,true);			
		}
		closeFileInputStream(newFile);
		
		if(ret == false)
		{
			return null;
		}
		
		SVNCommitInfo commitInfo = commit(editor);
		if(commitInfo == null)
		{
			System.out.println("svnModifyFile() commit failed ");
			return null;
		}

		System.out.println("svnModifyFile() The file was modified: " + commitInfo);
		return commitInfo.getNewRevision()+"";
	}
	
	//复制文件
	public String svnCopy(String srcParentPath,String srcEntryName, String dstParentPath,String dstEntryName,String commitMsg,String commitUser,boolean isMove)
	{
    	if(srcParentPath == null || srcEntryName == null || dstParentPath == null || dstEntryName == null)
    	{
    		System.out.println("svnCopy() 非法参数：srcParentPath srcEntryName dstParentPath or dstEntryName is null!");
    		return null;
    	}
    	
		long latestRevision = -1;
		SVNNodeKind nodeKind;
		try {
			nodeKind = repository.checkPath(srcParentPath + srcEntryName,-1);
			if (nodeKind == SVNNodeKind.NONE) {
		    	System.err.println("remoteCopyEntry() There is no entry at '" + repositoryURL + "'.");
		        return null;
		    }
			latestRevision = repository.getLatestRevision();
		} catch (SVNException e) {
			System.out.println("remoteCopyEntry() Exception");
			e.printStackTrace();
			return null;
		}
	        
	    //Do copy File Or Dir
	    if(isMove)
	    {
	       System.out.println("svnCopy() move " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName);
	    }
        else
        {
 	       System.out.println("svnCopy() copy " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName);
        }
	    
        ISVNEditor editor = getCommitEditor(commitMsg);
        if(editor == null)
        {
        	return null;
        }
        
        if(copyEntry(editor, srcParentPath,srcEntryName,dstParentPath, dstEntryName,true,latestRevision,isMove) == false)
        //if(copyEntry(editor, srcParentPath,srcEntryName,dstParentPath, dstEntryName,isDir,latestRevision,isMove) == false)
        {
        	return null;
        }
        
     	SVNCommitInfo commitInfo  = commit(editor);
    	if(commitInfo == null)
    	{
    		return null;
    	}
    	System.out.println("remoteCopyEntry(): " + commitInfo);
	    return commitInfo.getNewRevision() + "";
	}
	
    //删除文件或目录
  	public String svnDelete(String parentPath,String entryName,String commitMsg, String commitUser)
  	{
        ISVNEditor editor = getCommitEditor(commitMsg);
        if(editor == null)
        {
        	return null;
        }
        
        if(deleteEntry(editor, parentPath,entryName,true) == false)
        {
        	return null;
        }
    	
	    SVNCommitInfo commitInfo  = commit(editor);
    	if(commitInfo == null)
    	{
    		return null;
    	}
    	System.out.println("svnDelete(): " + commitInfo);
    	
        return commitInfo.getNewRevision() + "";
  	}
  	
	//getCommitEditor
	private ISVNEditor getCommitEditor(String commitMsg)
	{
        //删除目录
        ISVNEditor editor;
		try {
			editor = repository.getCommitEditor(commitMsg, null);
		} catch (SVNException e) {
			System.out.println("getCommitEditor() getCommitEditor Exception");
			e.printStackTrace();
			return null;
		}
		return editor;
	}
	
	//commit
	private SVNCommitInfo commit(ISVNEditor editor)
	{
		SVNCommitInfo commitInfo = null;
        try {
        	commitInfo = editor.closeEdit();
		} catch (SVNException e) {
			System.out.println("commmit() closeEdit Exception");
			e.printStackTrace();
			return null;
		}
        return commitInfo;
	}
	
	//add Entry
    private boolean addEntry(ISVNEditor editor,String parentPath, String entryName,boolean isFile,InputStream fileData,boolean openRoot, boolean openParent,boolean keepOpen){    
    	System.out.println("addEntry() parentPath:" + parentPath + " entryName:" + entryName + " isFile:" + isFile);
    	
    	if(parentPath == null || entryName == null)
    	{
    		System.out.println("addEntry() 非法参数：parentPath or entryName is null!");
    		return false;
    	}
    	
    	try {
    		if(openRoot)
    		{
    			editor.openRoot(-1);
    		}
	 
			if(openParent)
			{
				editor.openDir(parentPath, -1);
			}
			
	        String entryPath = parentPath + entryName;
	    	if(isFile)
	    	{
	    		editor.addFile(entryPath, null, -1);
	    		editor.applyTextDelta(entryPath, null);
	    		SVNDeltaGenerator deltaGenerator = new SVNDeltaGenerator();
	    		String checksum = deltaGenerator.sendDelta(entryPath, fileData, editor, true);
	    		System.out.println("addEntry() checksum[" + checksum +"]");
	    		//close new added File
	    		editor.closeFile(entryPath, checksum);
	    	}
	    	else
	    	{
		        editor.addDir(entryPath, null, -1);
		        if(keepOpen == false)
		        {
		        	//close new added Dir
			        editor.closeDir();
		        }
	    	}
	    	
	    	if(openParent)
	    	{
	    		//close the parent Dir
	    		editor.closeDir();
	    	}
	    	
	    	if(openRoot)
	    	{
	    		//close root dir
	    		editor.closeDir();
	    	}
    	} catch (SVNException e) {
	    	System.out.println("addFile(): Schedule to addFile Failed!");
			e.printStackTrace();
			return false;
	    }    
        return true;
    }

	//doAddDir
    private boolean addDir(ISVNEditor editor, String parentPath,String dirName){
    	return addEntry(editor,parentPath,dirName,false,null,true,true,false);
    }
    
	//doAddFile
    private boolean addFile(ISVNEditor editor, String parentPath,String fileName,InputStream fileData){
    	return addEntry(editor,parentPath,fileName,true,fileData,true,true,false);
    }

    private boolean deleteEntry(ISVNEditor editor, String parentPath,String entryName,boolean openRoot)
    {
    	if(parentPath == null || entryName == null)
    	{
    		System.out.println("deleteEntry() 非法参数：parentPath or entryName is null!");
    		return false;
    	}
    	
    	String entryPath = parentPath + entryName;
		
        try{
	    	if(openRoot)
	    	{
	    		editor.openRoot(-1);
	    	}
	        
	    	editor.deleteEntry(entryPath, -1);
	        
	        if(openRoot)
	        {
	        	editor.closeDir();
	        }
    	} catch (SVNException e) {
			System.out.println("deleteEntry(): Schedule to deleteEntry Failed!");
    		e.printStackTrace();
			return false;
		}
        return true;
    }

    
    //doModifyFile
    private boolean modifyFile(ISVNEditor editor,String parentPath, String entryName, InputStream oldFileData,InputStream newFileData,boolean openRoot,boolean openParent)
    {
    	if(parentPath == null || entryName == null)
    	{
    		System.out.println("modifyFile() 非法参数：parentPath or entryName is null!");
    		return false;
    	}
    	
    	String entryPath = parentPath + entryName;
    	try {
        	if(openRoot)
			{
        		editor.openRoot(-1);
			}
        
        	if(openParent)
        	{
        		editor.openDir(parentPath, -1);
        	}
        	
	        editor.openFile(entryPath, -1);
	        
	        editor.applyTextDelta(entryPath, null);
	        
	        SVNDeltaGenerator deltaGenerator = new SVNDeltaGenerator();
	        String checksum = null;
	        if(oldFileData == null)
	        {
	        	checksum = deltaGenerator.sendDelta(entryPath, newFileData, editor, true);
	        	System.out.println("modifyFile(): whole checkSum:" + checksum);
	        }
	        else
	        {
	            try {
	            	checksum = deltaGenerator.sendDelta(entryPath, oldFileData, 0, newFileData, editor, true);
	            	System.out.println("modifyFile(): diff checkSum:" + checksum);
	    		}catch (SVNException e) {
	    			System.out.println("modifyFile(): sendDelta failed try to sendDelta with oleFileData is null!");
	    			e.printStackTrace();
	    			checksum = deltaGenerator.sendDelta(entryPath, newFileData, editor, true); 	
	            	System.out.println("modifyFile(): whole checkSum:" + checksum);

	    		}
	        }
	 
	        /*
	         * Closes the file.
	         */
	        editor.closeFile(entryPath, checksum);
	
	        if(openParent)
	        {
	        	editor.closeDir();
	        }
	        
	        if(openRoot)
	        {
	        	editor.closeDir();
	        }
		} catch (SVNException e) {
			System.out.println("modifyFile(): Schedule to modifyFile Failed!");
			e.printStackTrace();
			return false;
		}
        return true;
    }
    
    //doCopyFile
    private boolean copyEntry(ISVNEditor editor,String srcParentPath, String srcEntryName, String dstParentPath,String dstEntryName,boolean isDir,long revision,boolean isMove) 
    {
    	if(srcParentPath == null || srcEntryName == null || dstParentPath == null || dstEntryName == null)
    	{
    		System.out.println("copyEntry() 非法参数：srcParentPath srcEntryName dstParentPath or dstEntryName is null!");
    		return false;
    	}

        try {
			editor.openRoot(-1);
        
			editor.openDir(dstParentPath, -1);
	        
	    	//Copy the file
		    String dstEntryPath = dstParentPath + dstEntryName;
	    	String srcEntryPath = srcParentPath + srcEntryName;
	    	//addFileSmartly(dstEntryPath, srcEntryPath);
	    	if(isDir)
			{
				editor.addDir(dstEntryPath, srcEntryPath, revision);
				editor.closeDir();				
			}
			else
			{	
				editor.addFile(dstEntryPath, srcEntryPath, revision);
	    		editor.applyTextDelta(srcEntryPath, null);
	    		//SVNDeltaGenerator deltaGenerator = new SVNDeltaGenerator();
	    		String checksum = "d41d8cd98f00b204e9800998ecf8427e";
				editor.closeFile(dstEntryPath, checksum);	//CheckSum need to be given
			}	
	    	

	        //close the parent Dir
	        editor.closeDir();
	        
	    	if(isMove)
	    	{
	    		editor.deleteEntry(srcEntryPath, -1);
	    	}
	
	        /*
	         * Closes the root directory.
	         */
	        editor.closeDir();

		} catch (SVNException e) {
			System.out.println("copyFile(): Schedule to copyEntry Failed!");
			e.printStackTrace();
			return false;
		}
        return true;
    }
    
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public List<Doc> getDocList(Repos repos, Long pid, String remoteEntryPath, int level, long revision) 
	{
    	if(remoteEntryPath == null)
    	{
    		System.out.println("getDocList() 非法参数：remoteEntryPath is null!");
    		return null;
    	}
		
		List <Doc> subEntryList =  new ArrayList<Doc>();
		
		Collection<SVNDirEntry> entries = null;
		try {
			entries = repository.getDir(remoteEntryPath, revision, null,(Collection) null);
		} catch (SVNException e) {
			System.out.println("getDocList() getDir Failed:" + remoteEntryPath);
			e.printStackTrace();
			return null;
		}
	    Iterator<SVNDirEntry> iterator = entries.iterator();
	    while (iterator.hasNext()) 
	    {
	    	SVNDirEntry entry = iterator.next();
	    	int type = convertSVNNodeKindToEntryType(entry.getKind());
	    	if(type <= 0)
	    	{
	    		continue;
	    	}
	    	
	    	String name = entry.getName();
	    	Long lastChangeTime = entry.getDate().getTime();
	    	Doc doc = new Doc();
	    	doc.setVid(repos.getId());
	    	doc.setPid(pid);
	    	doc.setPath(remoteEntryPath);	    	

	    	doc.setDocId(buildDocIdByName(level,name));
	    	doc.setName(name);
	    	doc.setType(type);
	    	doc.setSize(entry.getSize());
	    	doc.setCreateTime(lastChangeTime);
	    	doc.setLatestEditTime(lastChangeTime);
	    	doc.setRevision(entry.getRevision()+"");
	        subEntryList.add(doc);
	    }
	    return subEntryList;
	}
    
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public List<SVNDirEntry> getSubEntryList(String remoteEntryPath, long revision) 
	{
    	if(remoteEntryPath == null)
    	{
    		System.out.println("getSubEntryList() 非法参数：remoteEntryPath is null!");
    		return null;
    	}
		
		List <SVNDirEntry> subEntryList =  new ArrayList<SVNDirEntry>();
		
		Collection<SVNDirEntry> entries = null;
		try {
			entries = repository.getDir(remoteEntryPath, revision, null,(Collection) null);
		} catch (SVNException e) {
			System.out.println("getSubEntries() getDir Failed:" + remoteEntryPath);
			e.printStackTrace();
			return null;
		}
	    Iterator<SVNDirEntry> iterator = entries.iterator();
	    while (iterator.hasNext()) 
	    {
	    	SVNDirEntry entry = iterator.next();
	        subEntryList.add(entry);
	    }
	    return subEntryList;
	}
	
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public Collection<SVNDirEntry> getSubEntries(String remoteEntryPath, long revision) 
	{
    	if(remoteEntryPath == null)
    	{
    		System.out.println("getSubEntries() 非法参数：remoteEntryPath is null!");
    		return null;
    	}
    	
		Collection<SVNDirEntry> entries = null;
		try {
			entries = repository.getDir(remoteEntryPath, revision, null,(Collection) null);
		} catch (Exception e) {
			System.out.println("getSubEntries() getDir Failed:" + remoteEntryPath);
			e.printStackTrace();
			return null;
		}
		return entries;
	}
	
	public boolean getEntry(String parentPath, String entryName, String localParentPath, String targetName,long revision) {
		System.out.println("svnGetEntry() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
    	if(parentPath == null || entryName == null)
    	{
    		System.out.println("getEntry() 非法参数：parentPath or entryName is null!");
    		return false;
    	}	
		
		//check targetName and set
		if(targetName == null)
		{
			targetName = entryName;
		}
		
		String remoteEntryPath = parentPath + entryName;
		SVNNodeKind nodeKind = null;
		try {
			nodeKind = repository.checkPath(remoteEntryPath,revision);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			System.out.println("svnGetEntry() checkPath Exception");
	        e.printStackTrace();
			return false;
		}
		
		if (nodeKind == SVNNodeKind.NONE) {
            System.out.println("svnGetEntry() There is no entry at '" + repositoryURL + "'.");
            return false;
        } else if (nodeKind == SVNNodeKind.DIR) {
        	//Get the subEntries and call svnGetEntry
			String localEntryPath = localParentPath + targetName + "/";
        	if(!targetName.isEmpty())
			{
				File dir = new File(localParentPath,targetName);
				dir.mkdir();
			}
			else
			{
				localEntryPath = localParentPath;
			}
        	
			List <SVNDirEntry> subEntries = getSubEntryList(remoteEntryPath,revision);
			for(int i=0;i<subEntries.size();i++)
			{
				SVNDirEntry subEntry =subEntries.get(i);
				String subEntryName = subEntry.getName();
				if(getEntry(remoteEntryPath+"/",subEntryName,localEntryPath,null,revision) == false)
				{
					System.out.println("svnGetEntry() svnGetEntry Failed: " + remoteEntryPath+ "/" + subEntryName);
					return false;
				}
			}
        	return true;
        }
        else if(nodeKind == SVNNodeKind.FILE)
        {	
            FileOutputStream out = null;
			try {
				out = new FileOutputStream(localParentPath + targetName);
			} catch (Exception e) {
				System.out.println("svnGetEntry() new FileOutputStream Failed:" + localParentPath + targetName);
				e.printStackTrace();
				return false;
			}
			
	        SVNProperties fileProperties = new SVNProperties();
            try {
				repository.getFile(remoteEntryPath, revision, fileProperties, out);
	            out.close();
            } catch (Exception e) {
				// TODO Auto-generated catch block
				System.out.println("svnGetEntry() getFile Exception");
				e.printStackTrace();
				return false;
			}
        }
        return true;
	}
	
    /*
     * Displays error information and exits. 
     */
    public static void error(String message, Exception e){
        System.err.println(message+(e!=null ? ": "+e.getMessage() : ""));
    }
    
    /*************** Rainy Added Interfaces Based on Low Level APIs End **************/
  

    /***************************** Reference Code For svnKit Operation with low level API *********************/
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
}
