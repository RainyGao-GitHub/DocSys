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
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.eclipse.jgit.revwalk.RevCommit;
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
    public String getLatestReposRevision() 
	{
    	try {
			return repository.getLatestRevision() + "";
		} catch (SVNException e) {
			System.err.println("getLatestRevision() 异常");
			e.printStackTrace();
			return null;
		}
	}
    
	private SVNLogEntry getLatestRevCommit(Doc doc) 
	{
		String entryPath = doc.getPath() + doc.getName();
		String[] targetPaths = new String[]{entryPath};
				
		Collection<SVNLogEntry> logEntries = null;
        try {
        	long startRevision = repository.getLatestRevision();
    		long endRevision = startRevision;
    		logEntries = repository.log(targetPaths, null,startRevision, endRevision, false, true);	//不获取copy等历史
            
            for (Iterator<SVNLogEntry> entries = logEntries.iterator(); entries.hasNext();) {
                /*
                 * gets a next SVNLogEntry
                 */
                SVNLogEntry logEntry = (SVNLogEntry) entries.next();
                return logEntry;        
            }
            
        } catch (Exception e) {
            System.out.println("getLogEntryList() repository.log() 异常");
            e.printStackTrace();
        }

        return null;
	}
    
    private String getLatestRevision(Doc doc) 
    {
    	SVNLogEntry commit = getLatestRevCommit(doc);	
    	if(commit == null)
    	{
    		return null;
    	}
    	
        String revision = commit.getRevision() + "";  //revision
		return revision;
	}
    
    //获取Doc在指定Revision的Type和真实Revision，该接口在同步调用时必须保证Revision的正确
    //但获取Revision是一个低效的操作，因此需要指定是否需要获取真实的Revision
    public Doc getDoc(Doc doc, Long revision)
	{    	
    	String entryPath = doc.getPath() + doc.getName();
    	
    	Integer type = checkPath(entryPath, revision);
    	if(type == null)
    	{
    		return null;
    	}
    	
        if(type ==  0 || revision != null)
		{
	    	System.out.println("getDoc() " + entryPath + " not exist for revision:" + revision); 
	    	Doc remoteEntry = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), doc.getLevel(), type, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
	    	remoteEntry.setRevision(revision+"");
	    	return remoteEntry;
		}
        
        SVNLogEntry commit = getLatestRevCommit(doc);
        if(commit == null)
        {
        	System.out.println("getDoc() Failed to getLatestRevCommit");
        	return null;
        }
		
        String commitId=commit.getRevision() + "";  //revision
	    String author=commit.getAuthor();  //作者
	    String commitUser=author;
	    long commitTime=commit.getDate().getTime();
	            
	    //String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
        Doc remoteDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), doc.getLevel(), type, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
		remoteDoc.setRevision(commitId);
        remoteDoc.setCreatorName(author);
        remoteDoc.setLatestEditorName(commitUser);
        remoteDoc.setLatestEditTime(commitTime);
        return remoteDoc;
	}
    
    //getHistory filePath: remote File Path under repositoryURL
	public List<LogEntry> getHistoryLogs(String entryPath,long startRevision, long endRevision, int maxLogNum) 
    {
    	System.out.println("getHistoryLogs entryPath:" + entryPath);	
    	if(entryPath == null)
    	{
        	System.out.println("getHistoryLogs() 非法参数：entryPath is null");
        	return null;
    	}
    	
    	//获取startRevision and endRevision
    	if(endRevision < 0)
    	{
        	try {
	    	    endRevision = repository.getLatestRevision();
	        } catch (SVNException svne) {
	            System.err.println("error while fetching the latest repository revision: " + svne.getMessage());
	            return null;
	        }
    	}
        
    	if(maxLogNum > 0)
    	{
    		if((endRevision - startRevision) > maxLogNum)
    		{
    			startRevision = endRevision - maxLogNum;
    		}
    	}

    	//Get logList
    	List<LogEntry> logList = getLogEntryList(entryPath, startRevision, endRevision, maxLogNum);
        return logList;
    }
	
	private List<LogEntry> getLogEntryList(String entryPath, long startRevision, long endRevision, int maxLogNum) {
		System.out.println("getLogEntryList() entryPath:" + entryPath + " startRevision:" + startRevision + " endRevision:" + endRevision + " maxLogNum:" + maxLogNum);
        List<LogEntry> logList = new ArrayList<LogEntry>();
        
		String[] targetPaths = new String[]{entryPath};
		
        Collection<SVNLogEntry> logEntries = null;
        try {
            logEntries = repository.log(targetPaths, null,startRevision, endRevision, false, false);
        } catch (SVNException svne) {
            System.out.println("getLogEntryList() repository.log() 异常: " + svne.getMessage());
            return null;
        }
        
        long oldestRevision = 0;
        
        for (Iterator<SVNLogEntry> entries = logEntries.iterator(); entries.hasNext();) {
            /*
             * gets a next SVNLogEntry
             */
            SVNLogEntry logEntry = (SVNLogEntry) entries.next();
            long revision = logEntry.getRevision();
            if(oldestRevision == 0)
            {
            	oldestRevision = 0;
            }
            
            String commitId = "" + revision;
            String commitUser = logEntry.getAuthor(); //提交者
            String commitMessage= logEntry.getMessage();
            long commitTime = logEntry.getDate().getTime();            
            
            System.out.println("revision:"+revision);
            System.out.println("commitId:"+commitId);
            System.out.println("commitUser:"+commitUser);
            System.out.println("commitMessage:"+commitMessage);
            System.out.println("commitName:"+commitUser);
            System.out.println("commitTime:"+commitTime);
            
            LogEntry log = new LogEntry();
            log.setRevision(revision);
            log.setCommitId(commitId);
            log.setCommitUser(commitUser);
            log.setCommitMsg(commitMessage);
            log.setCommitTime(commitTime);
            
            logList.add(0,log);	//add to the top
        }
        
        int nextMaxLogNum = maxLogNum - logList.size();
        if(nextMaxLogNum <= 0)
        {
        	return logList;
        }
        
        //Try to get logEntry for deleted 
        if(oldestRevision > 0)
        {
        	long nextEndRevision = oldestRevision - 1;
        	List<LogEntry> nextLogList = getLogEntryList(entryPath, startRevision, nextEndRevision, nextMaxLogNum);        	
        	logList.addAll(nextLogList);
        }
        return logList;
	}

	public List<ChangedItem> getHistoryDetail(Doc doc, String commitId) 
	{
		String entryPath = doc.getPath() + doc.getName();
    	System.out.println("getHistoryDetail entryPath:" + entryPath);	
		
		long revision = -1;
		if(commitId != null)
		{
			revision = Long.parseLong(commitId);
		}
    	
    	/*
         * Get History Info
         */
        String[] targetPaths = new String[]{entryPath};
        Collection<SVNLogEntry> logEntries = null;
        try {
            logEntries = repository.log(targetPaths, null,revision, revision, true, false);
        } catch (SVNException svne) {
            System.out.println("getHistoryDetail() 获取日志异常：" + svne.getMessage());
            return null;
        }
        
        for (Iterator<SVNLogEntry> entries = logEntries.iterator(); entries.hasNext();) {
            /*
             * gets a next SVNLogEntry
             */
            SVNLogEntry logEntry = (SVNLogEntry) entries.next();
            
            if(logEntry.getChangedPaths().size() > 0) 
            {
            	List<ChangedItem> changedItemList = new ArrayList<ChangedItem>();
                
            	System.out.println("changed Entries:");
                Set<String> changedPathsSet = logEntry.getChangedPaths().keySet();
                for (Iterator<String> changedPaths = changedPathsSet.iterator(); changedPaths.hasNext();) 
                {
                	//obtains a next SVNLogEntryPath
                    SVNLogEntryPath svnLogEntryPath = (SVNLogEntryPath) logEntry.getChangedPaths().get(changedPaths.next());
                    String nodePath = formatEntryPath(svnLogEntryPath.getPath());
                    
                    Integer entryType = getEntryType(svnLogEntryPath.getKind());
                    Integer changeType = getChangeType(svnLogEntryPath);
                    String srcEntryPath = formatEntryPath(svnLogEntryPath.getCopyPath());
                    
                    if(srcEntryPath == null)
                    {
                    	System.out.println(" " + svnLogEntryPath.getType() + "	" + nodePath);                                     	
                    }
                    else
                    {
                    	System.out.println(" " + svnLogEntryPath.getType() + "	" + nodePath + " from " + srcEntryPath + " at revision " + commitId);                
                    }
                    
                    //Add to changedItemList
                    ChangedItem changedItem = new ChangedItem();
                    changedItem.setChangeType(changeType);	
                    changedItem.setEntryType(entryType);
                    changedItem.setEntryPath(nodePath);
                    
                    changedItem.setSrcEntryPath(srcEntryPath);
                    
                    changedItem.setCommitId(commitId);
                    
                    changedItemList.add(changedItem);
                }
                return changedItemList;
            }
        }
		return null;
	}	
    
    private String formatEntryPath(String path) {
    	if(path == null || path.length() == 0)
    	{
    		return path;
    	}
    	if(path.charAt(0) == '/')
    	{
    		return path.substring(1,path.length());
    	}
		return path;
	}

	private Integer getChangeType(SVNLogEntryPath svnLogEntryPath) {

    	switch(svnLogEntryPath.getType())
    	{
    	case 'A':
    		return 1;
    	case 'D':
    		return 2;
    	case 'M':
    		return 3;
    	case 'R':
    		return 5;
    	}
    	
    	return null;
	}

	private Integer getEntryType(SVNNodeKind nodeKind) 
    {
		if(nodeKind == null)
		{
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
	
	public Integer checkPath(String entryPath, Long revision)
	{
		if(revision == null)
		{
			revision = -1L;
		}
		
		SVNNodeKind nodeKind = null;
		try {
			nodeKind = repository.checkPath(entryPath, revision);
		} catch (SVNException e) {
			System.out.println("getEntryType() checkPath Error:" + entryPath);
			e.printStackTrace();
			return null;
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
	//localRootPath是需要本地的根目录
	//modifyEnable: 表示是否commit已经存在的文件
	//localRefRootPath是存放参考文件的根目录，如果对应文件存在且modifyEnable=true的话，则增量commit
	//subDocCommitFalg: 0:不Commit 1:Commit但不继承 2:Commit所有文件
	public String doAutoCommit(Doc doc, String commitMsg,String commitUser, boolean modifyEnable, HashMap<Long, Doc> commitHashMap, int subDocCommitFlag){
		
		String localRootPath = doc.getLocalRootPath();
		String localRefRootPath = doc.getLocalRefRootPath();
		
		System.out.println("doAutoCommit()" + " parentPath:" + doc.getPath() +" entryName:" + doc.getName() +" localRootPath:" + localRootPath + " commitMsg:" + commitMsg +" modifyEnable:" + modifyEnable + " localRefRootPath:" + localRefRootPath);
    	
    	File localParentDir = new File(localRootPath+doc.getPath());
		if(!localParentDir.exists())
		{
			System.out.println("doAutoCommit() localParentPath " + localRootPath+doc.getPath() + " not exists");
			return null;
		}
		if(!localParentDir.isDirectory())
		{
			System.out.println("doAutoCommit() localParentPath " + localRootPath+doc.getPath()  + " is not directory");
			return null;
		}
		
		//If remote parentPath not exists, need to set the autoCommit entry to parentPath
		Integer type = checkPath(doc.getPath(), null);
		if(type == null)
		{
			return null;
		}
		
		if(type == 0)
		{
			return doAutoCommitParent(doc, commitMsg, commitUser, modifyEnable);
		}	
		
		List <CommitAction> commitActionList = new ArrayList<CommitAction>();
		
		String entryPath = doc.getPath() + doc.getName();			
		File localEntry = new File(localRootPath + entryPath);
		//LocalEntry does not exist
		if(!localEntry.exists())	//Delete Commit
		{
			System.out.println("doAutoCommit() localEntry " + localRootPath + entryPath + " not exists");
			type = checkPath(entryPath, null);
		    if(type == null)
		    {
		    	return null;
		    }
		    
		    if(type == 0)
		    {
				System.out.println("doAutoCommit() remoteEnry " + entryPath + " not exists");
		        return getLatestReposRevision();
		    }
		    
		    System.out.println("doAutoCommit() 删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			insertDeleteAction(commitActionList,doc);
		}
		else
		{
			//LocalEntry is File
			if(localEntry.isFile())
			{
				System.out.println("doAutoCommit() localEntry " + localRootPath + entryPath + " is File");
					
			    type = checkPath(entryPath, null);
			    if(type == null)
			    {
			    	return null;
			    }
			    if(type == 0)
			    {
					System.out.println("doAutoCommit() 新增文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
					insertAddFileAction(commitActionList,doc,false);
			    }
			    else if(type != 1)
			    {
					System.out.println("doAutoCommit() 文件类型变更(目录->文件):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			    	insertDeleteAction(commitActionList,doc);
					insertAddFileAction(commitActionList,doc,false);
			    }
			    else
			    {
		    		//如果commitHashMap未定义，那么文件是否commit由modifyEnable标记决定
		    		if(commitHashMap == null) //文件内容改变	
		    		{
			            if(modifyEnable)
			            {
		            		System.out.println("doAutoCommit() 文件内容变更:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
		            		insertModifyFile(commitActionList,doc);
		            	}
		    		}
		    		else
		    		{
		    			Doc tempDoc = commitHashMap.get(doc.getDocId());
		    			if(tempDoc != null)
		    			{
		            		System.out.println("doAutoCommit() 文件内容变更（commitHashMap）:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
		            		insertModifyFile(commitActionList,doc);
		    			}
		    		}
			    }
			}
			else
			{
				//LocalEntry is Directory
				System.out.println("doAutoCommit() localEntry " + localRootPath + entryPath + " is Directory");
				scheduleForCommit(commitActionList, doc, modifyEnable, false, commitHashMap, subDocCommitFlag);
			}
		}
		
	    if(commitActionList == null || commitActionList.size() ==0)
	    {
	    	System.out.println("doAutoCommmit() There is nothing to commit");
	        return getLatestReposRevision();
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
	    	abortEdit(editor);
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
	}

	private void abortEdit(ISVNEditor editor) {
		try {
			editor.abortEdit();
		} catch (SVNException e) {
		    System.err.println("abortEdit() 异常");
			e.printStackTrace();
		}	
	}

	private String doAutoCommitParent(Doc doc, String commitMsg,String commitUser, boolean modifyEnable)
    {
    	String parentPath = doc.getPath();
        System.out.println("doAutoCommitParent() parentPath:" + parentPath);
    	if(parentPath.isEmpty())
    	{
    		return null;
    	}
    	
    	String [] paths = parentPath.split("/");
    	
    	String path = "";
    	String name = "";
    	try {
	    	for(int i=0; i< paths.length; i++)
	    	{
	    		name = paths[i];
	    		if(name.isEmpty())
	    		{
	    			continue;
	    		}
	    		
	    		Integer type = checkPath(path + name, null);
	    		if(type == null)
	    		{
	    			return null;
	    		}
	    		
	    		if(type == 0)
	    		{
	    			Doc tempDoc = buildBasicDoc(doc.getVid(), null, null, path, name, null, 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
	    			return doAutoCommit(tempDoc, commitMsg, commitUser, modifyEnable,null, 2);
	    		}
	    		path = path + name + "/";  		
	    	}
    	} catch (Exception e) {
    		System.out.println("doAutoCommitParent() Exception");
    		e.printStackTrace();
    	}
    	return null;
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
		Doc doc = action.getDoc();

		printObject("executeModifyAction:",doc);
		
		String entryPath = doc.getPath() + doc.getName();
		String localPath = doc.getLocalRootPath();
		String localRefPath = doc.getLocalRefRootPath();
		System.out.println("executeModifyAction() parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localPath:" + localPath + " localRefPath:" + localRefPath);
		
		
		InputStream oldData = null;
		if(localRefPath != null)
		{
			oldData = getFileInputStream(localRefPath + entryPath);
		}
		InputStream newData = getFileInputStream(localPath + entryPath);
    	boolean ret = false;
		if(action.isSubAction)
		{
			//subAction no need to openRoot and Parent
			ret = modifyFile(editor,doc.getPath(), doc.getName(), oldData, newData,false,false);
		}
		else
		{
   			ret = modifyFile(editor, doc.getPath(), doc.getName(), oldData, newData,false,true);       			
		}
		if(oldData != null)
		{
			closeFileInputStream(oldData);
		}
		closeFileInputStream(newData);
		return ret;
	}

	private boolean executeDeleteAction(ISVNEditor editor, CommitAction action) {
		Doc doc = action.getDoc();

		printObject("executeModifyAction:",doc);
		System.out.println("executeDeleteAction() parentPath:" + doc.getPath() + " entryName:" + doc.getName());
		return deleteEntry(editor, doc, false);
	}

	private boolean executeAddAction(ISVNEditor editor, CommitAction action) {
		Doc doc = action.getDoc();

		printObject("executeAddAction:",doc);

		String localPath = doc.getLocalRootPath();
		String localRefPath = doc.getLocalRefRootPath();
		
		String parentPath = doc.getPath();
		String entryName = doc.getName();
		String entryPath = doc.getPath() + doc.getName();
		
		System.out.println("executeAddAction() parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localPath:" + localPath + " localRefPath:" + localRefPath);
		
		//entry is file
		if(doc.getType() == 1)
		{
			String localEntryPath = localPath + entryPath;
    		
    		InputStream fileData = getFileInputStream(localEntryPath);
    		if(fileData == null)
    		{
    			return false;
    		}
    		
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
    		if(action.getSubActionList() == null)	
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
    		if(action.getSubActionList() == null)	
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

	public void scheduleForCommit(List<CommitAction> actionList, Doc doc, boolean modifyEnable,boolean isSubAction, HashMap<Long, Doc> commitHashMap, int subDocCommitFlag)
	{	
		String localRootPath = doc.getLocalRootPath(); 
		String localRefRootPath = doc.getLocalRefRootPath();
		System.out.println("scheduleForCommit()  parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localRootPath:" + localRootPath + " localRefRootPath:" + localRefRootPath + " modifyEnable:" + modifyEnable + " subDocCommitFlag:" + subDocCommitFlag);
		
    	if(doc.getName().isEmpty())
    	{
    		scanForSubDocCommit(actionList, doc, modifyEnable, isSubAction, commitHashMap, subDocCommitFlag);
    		return;
    	}
 	
    	String entryPath = doc.getPath() + doc.getName();
    	String localEntryPath = localRootPath + entryPath;    	
    	File localEntry = new File(localEntryPath);

		Integer remoteEntryType = checkPath(entryPath, null);
    	if(remoteEntryType == null)
    	{
    		System.out.println("scheduleForCommit() checkPath 异常!");
			return;
		}
    	
    	//本地删除
    	if(!localEntry.exists())
    	{
    		if(remoteEntryType == 0)
    		{
    			//已同步
    			return;
    		}
    		System.out.println("scheduleForCommit() 删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    		insertDeleteAction(actionList,doc);
    		return;
    	}
    	
    	//本地存在
    	int localEntryType = localEntry.isDirectory()? 2:1;
    	doc.setType(localEntryType);
    	switch(localEntryType)
    	{
    	case 1:	//文件
    		if(remoteEntryType == 0) 	//新增文件
	    	{
        		System.out.println("scheduleForCommit() 新增文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    			insertAddFileAction(actionList,doc,isSubAction);
	            return;
    		}
    		
    		if(remoteEntryType != 1)	//文件类型改变
    		{
        		System.out.println("scheduleForCommit() 文件类型变更(目录->文件):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    			insertDeleteAction(actionList,doc);
    			insertAddFileAction(actionList,doc,isSubAction);
	            return;
    		}
    		
    		//如果commitHashMap未定义，那么文件是否commit由modifyEnable标记决定
    		if(commitHashMap == null) //文件内容改变	
    		{
	            if(modifyEnable)
	            {
            		System.out.println("scheduleForCommit() 文件内容变更:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
            		insertModifyFile(actionList,doc);
            		return;
            	}
    		}
    		else
    		{
    			Doc tempDoc = commitHashMap.get(doc.getDocId());
    			if(tempDoc != null)
    			{
            		System.out.println("scheduleForCommit() 文件内容变更（commitHashMap）:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
            		insertModifyFile(actionList,doc);
            		return;
    			}
    		}
    		break;
    	case 2:
    		if(remoteEntryType == 0) 	//新增目录
	    	{
        		System.out.println("scheduleForCommit() 新增目录:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    			//Add Dir
    			insertAddDirAction(actionList,doc,isSubAction);
	            return;
    		}
    		
    		if(remoteEntryType != 2)	//文件类型改变
    		{
    			System.out.println("scheduleForCommit() 文件类型变更(文件->目录):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    			insertDeleteAction(actionList,doc);
	        	insertAddDirAction(actionList,doc, isSubAction);
	            return;
    		}
    		
    		scanForSubDocCommit(actionList, doc, modifyEnable, isSubAction, commitHashMap, subDocCommitFlag);
    		break;
    	}
    	return;   	
	}

	private void scanForSubDocCommit(List<CommitAction> actionList, Doc doc,
			boolean modifyEnable, boolean isSubAction,
			HashMap<Long, Doc> commitHashMap, int subDocCommitFlag) {

		String localRootPath = doc.getLocalRootPath(); 
		String localRefRootPath = doc.getLocalRefRootPath();

		System.out.println("scanForSubDocCommit()  parentPath:" + doc.getPath() + doc.getName() + " localRootPath:" + localRootPath + " localRefParentPath:" + localRefRootPath + " modifyEnable:" + modifyEnable + " subDocCommitFlag:" + subDocCommitFlag);
		
		if(subDocCommitFlag == 0) //不递归
		{
			return;
		}		
		if(subDocCommitFlag == 1)	//不可继承递归
		{
			subDocCommitFlag = 0;
		}
		
		HashMap<Long, Doc> docHashMap = new HashMap<Long, Doc>();
		
		String subDocParentPath = doc.getPath() + doc.getName() + "/";
		if(doc.getName().isEmpty())
		{
			 subDocParentPath = doc.getPath();
		}
		int subDocLevel = doc.getLevel() + 1;

		//遍历仓库所有子目录
		Collection<SVNDirEntry> entries = getSubEntries(doc.getPath() + doc.getName(), -1L);
        if(entries != null)
        {
			Iterator<SVNDirEntry> iterator = entries.iterator();
	        while (iterator.hasNext()) 
	        {
	            SVNDirEntry remoteSubEntry = (SVNDirEntry) iterator.next();
	            int subDocType = (remoteSubEntry.getKind() == SVNNodeKind.FILE)? 1:2;
	            Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subDocParentPath, remoteSubEntry.getName(), subDocLevel, subDocType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), remoteSubEntry.getSize(), "");
	            docHashMap.put(subDoc.getDocId(), subDoc);
	            scheduleForCommit(actionList, subDoc, modifyEnable, isSubAction, commitHashMap, subDocCommitFlag);
	        }
        }
        
        //Go Through localSubDocs
        File dir = new File(localRootPath + doc.getPath() + doc.getName());
        File[] tmp=dir.listFiles();
        for(int i=0;i<tmp.length;i++)
        {
        	File localSubEntry = tmp[i];
        	int subDocType = localSubEntry.isFile()? 1: 2;
        	Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subDocParentPath, localSubEntry.getName(), subDocLevel, subDocType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), localSubEntry.length(), "");
            
        	if(docHashMap.get(subDoc.getDocId()) == null)
        	{
        		if(localSubEntry.isDirectory())
        		{
        			insertAddDirAction(actionList, subDoc, isSubAction);
        		}
        		else
        		{
        			insertAddFileAction(actionList, subDoc, isSubAction);
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
			
	//move or copy Doc
	public String copyDoc(Doc srcDoc, Doc dstDoc, String commitMsg,String commitUser,boolean isMove)
	{   
		if(srcDoc.getRevision() == null || srcDoc.getRevision().isEmpty())
		{
			srcDoc.setRevision(getLatestRevision(srcDoc));
		}
		
		String srcEntryPath = srcDoc.getPath() + srcDoc.getName();
		Integer type = checkPath(srcEntryPath,null);
		if(type == null)
		{
			System.out.println("remoteCopyEntry() Exception");
			return null;
		}
		
		if (type == 0) 
		{
		    System.err.println("remoteCopyEntry() There is no entry at '" + repositoryURL + "'.");
		    return null;
		}

		String dstEntryPath = dstDoc.getPath() + dstDoc.getName();
	    //Do copy File Or Dir
	    if(isMove)
	    {
	       System.out.println("svnCopy() move " + srcEntryPath + " to " + dstEntryPath);
	    }
        else
        {
 	       System.out.println("svnCopy() copy " + srcEntryPath + " to " + dstEntryPath);
        }
	    
        ISVNEditor editor = getCommitEditor(commitMsg);
        if(editor == null)
        {
        	return null;
        }
        
        boolean isDir = true;
        //Due to svnkit issue, copy always use isDir
        //if(srcDoc.getType() == 1)
        //{
        //	isDir = false;
        //}
        
    	Long revision = Long.parseLong(srcDoc.getRevision());
        
        if(copyEntry(editor, srcDoc.getPath(), srcDoc.getName(), dstDoc.getPath(), dstDoc.getName(), isDir, revision, isMove) == false)
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
    
	private boolean deleteEntry(ISVNEditor editor, Doc doc, boolean openRoot)
    {    	
        try{
	    	if(openRoot)
	    	{
	    		editor.openRoot(-1);
	    	}
	        
	    	editor.deleteEntry(doc.getPath() + doc.getName(), -1);
	        
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
	    	//目前svnkit无法针对文件进行copy
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
	public List<Doc> getDocList(Repos repos, Doc doc, long revision) 
	{	
		String entryPath = doc.getPath() + doc.getName();
		
		List <Doc> subEntryList =  new ArrayList<Doc>();
		
		Integer type = checkPath(entryPath, revision);
		if(type == null || type == 0 || type == 1)
		{
			return null;
		}
		
		
		Collection<SVNDirEntry> entries = getSubEntries(entryPath, revision);
		if(entries == null)
		{
			return null;
		}
		
		String subDocParentPath = doc.getPath() + doc.getName() + "/";
		if(doc.getName().isEmpty())
		{
			subDocParentPath = doc.getPath();
		}
		int subDocLevel = doc.getLevel() + 1;
		
	    Iterator<SVNDirEntry> iterator = entries.iterator();
	    while (iterator.hasNext()) 
	    {
	    	SVNDirEntry subEntry = iterator.next();
	    	int subEntryType = getEntryType(subEntry.getKind());
	    	if(type <= 0)
	    	{
	    		continue;
	    	}
			
	    	String subEntryName = subEntry.getName();
	    	Long lastChangeTime = subEntry.getDate().getTime();
	    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), subDocParentPath, subEntryName, subDocLevel, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntry.getSize(), "");
	    	subDoc.setSize(subEntry.getSize());
	    	subDoc.setCreateTime(lastChangeTime);
	    	subDoc.setLatestEditTime(lastChangeTime);
	    	subDoc.setRevision(subEntry.getRevision()+"");
	        subEntryList.add(subDoc);
	    }
	    return subEntryList;
	}
	
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public Collection<SVNDirEntry> getSubEntries(String remoteEntryPath, Long revision) 
	{    	
		if(revision == null)
		{
			revision = -1L;
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
	
	
	
	public List<Doc> getEntry(Doc doc, String localParentPath, String targetName,Long revision, boolean force, HashMap<String, String> downloadList) {
		String parentPath = doc.getPath();
		String entryName = doc.getName();
		
		System.out.println("getEntry() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
		List<Doc> successDocList = new ArrayList<Doc>();	
		
		//check targetName and set
		if(targetName == null)
		{
			targetName = entryName;
		}
		
		String remoteEntryPath = parentPath + entryName;
    	
		Doc remoteDoc = getDoc(doc, revision);
		if(remoteDoc == null || remoteDoc.getType() <= 0)
		{
			//entryName是空，表示当前访问的远程的根目录，必须存在
			if(remoteEntryPath.isEmpty())
			{
				System.out.println("getEntry() remote root Entry not exists");
				return null;
			}
			
			System.out.println("getEntry() remote Entry " + remoteEntryPath  +" not exists");
			return null;
		}
		
		//远程节点是文件，本地节点不存在或也是文件则直接CheckOut，否则当enableDelete时删除了本地目录再 checkOut
		if(remoteDoc.getType() == 1) 
		{
			if(downloadList != null)
			{
				Object downloadItem = downloadList.get(remoteEntryPath);
				if(downloadItem == null)
				{
					System.out.println("getEntry() " + remoteEntryPath + " 不在下载列表,不下载！"); 
					return null;
				}
				else
				{
					System.out.println("getEntry() " + remoteEntryPath + " 在下载列表,需要下载！"); 
					downloadList.remove(downloadItem);
				}
			}
			
			if(getRemoteFile(remoteEntryPath, localParentPath, targetName, revision, force))
			{
				File localEntry = new File(localParentPath, targetName);
				if(!localEntry.exists())
				{
					System.out.println("getEntry() Checkout Ok, but localEntry not exists"); 
					return null;
				}
				
				doc.setSize(localEntry.length());
				doc.setLatestEditTime(localEntry.lastModified());
				doc.setCheckSum("");
				doc.setType(1);
		        doc.setRevision(remoteDoc.getRevision());
		        successDocList.add(doc);
				return successDocList;
			}
		}
		
		//远程节点存在，如果是目录的话（且不是根目录），则先新建本地目录，然后在CheckOut子目录，如果是根目录则直接CheckOut子目录，因为本地根目录必须存在
		if(remoteDoc.getType() == 2) 
		{
        	//Get the subEntries and call svnGetEntry
			if(getRemoteDir(localParentPath, targetName, force) == false)
        	{
				return null;
        	}
        	//Add to success Checkout list	
        	doc.setType(2);
			doc.setRevision(remoteDoc.getRevision());
			successDocList.add(doc);
        	
			//To Get SubDocs
			if(downloadList != null && downloadList.size() == 0)
			{
				System.err.println("getEntry() downloadList is empty"); 
				return successDocList;
			}
			
			int subDocLevel = doc.getLevel() + 1;
			String subDocParentPath = doc.getPath() + doc.getName() + "/";
			if(doc.getName().isEmpty())
			{
				subDocParentPath = doc.getPath();
			}
			
			String subEntryLocalParentPath = null;
			if(targetName.isEmpty())
			{
				subEntryLocalParentPath = localParentPath;
			}
			else
			{
				subEntryLocalParentPath = localParentPath + targetName + "/";
			}
			
			Collection<SVNDirEntry> entries = getSubEntries(remoteEntryPath,revision);
			if(entries == null)
			{
				return successDocList;
			}
			
		    Iterator<SVNDirEntry> iterator = entries.iterator();
		    while (iterator.hasNext()) 
		    {
		    	SVNDirEntry subEntry = iterator.next();
				String subEntryName = subEntry.getName();
				Integer subEntryType = getEntryType(subEntry.getKind());
				
				Long subEntryRevision = subEntry.getRevision();
				Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subDocParentPath, subEntryName, subDocLevel,subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, "");
				List<Doc> subSuccessList = getEntry(subDoc, subEntryLocalParentPath,subEntryName,subEntryRevision, force, downloadList);
				if(subSuccessList != null && subSuccessList.size() > 0)
				{
					successDocList.addAll(subSuccessList);
				}
			}
        	return successDocList;
        }
        
		return null;
	}

	public Long getPreviousCommmitId(Long revision) 
	{	
		if(revision == -1)
		{
			try {
				revision = repository.getLatestRevision();
			} catch (SVNException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return null;
			}
		}
		
		if(revision == 0)
		{
			System.out.println("getPreviousCommmitId() it is oldest revision:" + revision);
			return null;
		}
		
		return revision -1;
	}

	private boolean getRemoteFile(String remoteEntryPath, String localParentPath, String targetName, Long revision, boolean force) {
		File localEntry = new File(localParentPath + targetName);
		if(localEntry.exists() && localEntry.isDirectory())
		{
			if(force == false)
			{
				return false;
			}	
			
			if(delFileOrDir(localParentPath+targetName) == false)
			{
				return false;
			}
		}
	
        FileOutputStream out = null;
		try {
			out = new FileOutputStream(localParentPath + targetName);
		} catch (Exception e) {
			System.out.println("getRemoteFile() new FileOutputStream Failed:" + localParentPath + targetName);
			e.printStackTrace();
			return false;
		}
		
        SVNProperties fileProperties = new SVNProperties();
        try {
			repository.getFile(remoteEntryPath, revision, fileProperties, out);
			out.close();
            out = null;
        } catch (Exception e) {
			System.out.println("getRemoteFile() getFile Exception");
			e.printStackTrace();
			if(out != null)
			{
				try {
					out.close();
				} catch (IOException e1) {
					e1.printStackTrace();
				}
			}
			return false;
		}
        
        return true;
	}

	private boolean getRemoteDir(String localParentPath, String targetName, boolean force) {
		File localEntry = new File(localParentPath + targetName);
		if(localEntry.exists())
		{
			if(localEntry.isFile())
			{
				if(force)
				{
					if(delFileOrDir(localParentPath+targetName) == false)
					{
						return false;
					}
					
	        		return localEntry.mkdir();
				}
				else
				{
					return false;
				}
			}
			
			return true;
		}

		return localEntry.mkdir();
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

	public boolean subEntriesIsEmpty(Collection<SVNDirEntry> subEntries) 
	{
		if(subEntries == null || subEntries.size() == 0)
		{
			return true;
		}
		return false;
	}
}
