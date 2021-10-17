package com.DocSystem.common.remoteStorage;

import com.DocSystem.common.DocUtil;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.CommitAction.CommitAction;
import com.DocSystem.common.CommitAction.CommitType;
import com.DocSystem.common.entity.DocPushResult;
import com.DocSystem.entity.Doc;

import jcifs.smb.SmbFile;

import java.io.*;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.tmatesoft.svn.core.SVNCommitInfo;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNNodeKind;
import org.tmatesoft.svn.core.SVNProperties;
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
 
public class SvnUtil {
 
    private String url;
    private String username;
    private String password;
    private String privateKey;
    
    //For Low Level APIs
	private SVNRepository repository = null;
	private SVNURL repositoryURL = null;
	
	/**
     * 构造基于密码认证的sftp对象
     */
    public SvnUtil(String username, String password, String url) {
        this.username = username;
        this.password = password;
        this.url = url;
    }
 
    /**
     * 构造基于秘钥认证的sftp对象
     */
    public SvnUtil(String username, String password, String url, String privateKey) {
        this.username = username;
        this.url = url;
        this.privateKey = privateKey;
    }
 
    public boolean login() {
    	boolean ret = false;
    	try {
    		setupLibrary();
    		repositoryURL = SVNURL.parseURIEncoded(url);
    		repository = SVNRepositoryFactory.create(repositoryURL);
    		ISVNAuthenticationManager authManager = SVNWCUtil.createDefaultAuthenticationManager(username, password);
            repository.setAuthenticationManager(authManager);
            ret = true;
        } catch (Exception e) {
            e.printStackTrace();
        }
    	return ret;
    }
    
    private static void setupLibrary() {
        DAVRepositoryFactory.setup();
        SVNRepositoryFactoryImpl.setup();
        FSRepositoryFactory.setup();
    }
 
    /**
     * 关闭连接 server
     */
    public void logout() {
    }
    
    @SuppressWarnings({ "unchecked", "rawtypes" })
	public Collection<SVNDirEntry> listFiles(String directory){
    	Collection<SVNDirEntry> list = null;
    	try {
			list = repository.getDir(directory,  -1L, null,(Collection) null);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	return list;
    }
    
    public CommitAction addEntry(Doc doc, boolean isSubAction, List<CommitAction> commitActionList)
    {
    	CommitAction action = new CommitAction();
    	action.setAction(CommitType.ADD);
    	action.setDoc(doc);
    	action.isSubAction = isSubAction;
    	commitActionList.add(action);
    	return action;
    }    
    
    public void modifyFile(Doc doc, boolean isSubAction, List<CommitAction> commitActionList)
    {
		CommitAction action = new CommitAction();
    	action.setAction(CommitType.MODIFY);
    	action.setDoc(doc);
    	commitActionList.add(action);	
    }
    
    public CommitAction deleteEntry(Doc doc, boolean isSubAction, List<CommitAction> commitActionList)
    {
		CommitAction action = new CommitAction();
    	action.setAction(CommitType.DELETE);
    	action.setDoc(doc);
    	commitActionList.add(action);
    	return action;
    }
    
	private Long getRevisionByCommitId(String commitId) {
		if(commitId == null)
		{
			return -1L;
		}

		try {
			long revision = Long.parseLong(commitId);
			return revision;
		} catch (Exception e) {
			System.out.println("getRevisionByCommitId() 非法SVN commitId:" + commitId);
			e.printStackTrace();
			return null;
		}	
	}
    
	public Integer checkPath(String entryPath, String commitId)
	{
		Long revision = getRevisionByCommitId(commitId);
		if(revision == null)
		{
			return null;
		}
		return checkPath(entryPath, revision);
	}
	
	private Integer checkPath(String entryPath, long revision)
	{	
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
    
	public String doCommit(String commitMsg,String commitUser, DocPushResult pushResult, List<CommitAction> commitActionList)
	{		
	    if(commitActionList == null || commitActionList.size() ==0)
	    {
	    	System.out.println("doCommit() There is nothing to commit");
	        return null;
	    }
	    
	    CommitAction firstAction = commitActionList.get(0);
	    Doc doc = firstAction.getDoc();
	    if(doc.getDocId() == 0)
	    {
	    	Log.debug("doCommit() 禁止操作根节点！");
	    	return null;
	    }
	    
	    List<CommitAction> realCommitActionList = commitActionList;
	    //如果第一个节点是Add且父节点不是根节点，那么需要检查父节点是否存在，如果不存在那么需要获取真正的commitAction
	    if(firstAction.getAction() == CommitType.ADD && doc.getPid() != 0)	//如果父节点非根节点
	    {
	    	Integer type = checkPath(doc.getPath(), null);
	    	if(type == null || type == 0)
	    	{
	    		List<CommitAction> tempActionList = getRealCommitActionList(doc, commitUser, commitUser, pushResult, commitActionList);
	    		if(tempActionList != null)
	    		{
	    			realCommitActionList = tempActionList;
	    		}
	    	}
	    }
	    
	    ISVNEditor editor = getCommitEditor(commitMsg);
	    if(editor == null)
	    {
	    	System.out.println("doCommit() getCommitEditor Failed");
	        return null;
	    }
	        
	    if(executeCommitActionList(editor,realCommitActionList,true) == false)
	    {
	    	System.out.println("doCommit() executeCommitActionList Failed");
	    	abortEdit(editor);
	        return null;
	    }
	        
	    SVNCommitInfo commitInfo = commit(editor);
	    if(commitInfo == null)
	    {
	    	System.out.println("doCommit() commit failed: " + commitInfo);
	        return null;
	    }
	    System.out.println("doCommit() commit success: " + commitInfo);
	    return commitInfo.getNewRevision()+"";
	}
	
	private List<CommitAction> getRealCommitActionList(Doc doc, String commitMsg,String commitUser, DocPushResult pushResult, List<CommitAction> commitActionList)
    {
    	String parentPath = doc.getPath();
        System.out.println("getRealCommitActionList() parentPath:" + parentPath);

        String [] paths = parentPath.split("/");
    	
        boolean isSubAction = false;
        List<CommitAction> realCommitActionList = null;
        
    	String path = "";
    	String name = "";
    	
    	CommitAction action = null;
    	CommitAction parentAction = null;
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
	    			Doc tempDoc = DocUtil.buildBasicDoc(doc.getVid(), null, null, doc.getReposPath(), path, name, null, 2, true,  doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null, doc.offsetPath);
	    			List<CommitAction> tempCommitActionList = new ArrayList<CommitAction>();
	    			action = addEntry(tempDoc, isSubAction, tempCommitActionList);	    			
	    			if(isSubAction == false)
	    			{
	    				realCommitActionList = tempCommitActionList;
	    				pushResult.action = action;	    				
	    				isSubAction = true;
	    				parentAction = action;
	    			}
	    			else
	    			{
	    				parentAction.setSubActionList(tempCommitActionList);
	    				parentAction = action;
	    			}
	    		}
	    		path = path + name + "/";  		
	    	}
	    	
	    	//更新commitActionList为subActionList of last action
	    	for(int i = 0; i<commitActionList.size(); i++)
	    	{
	    		commitActionList.get(i).isSubAction = true;
	    	}
	    	action.setSubActionList(commitActionList);	
	    	
	    	pushResult.actionList = realCommitActionList;
    	} catch (Exception e) {
    		System.out.println("doAutoCommitParent() Exception");
    		e.printStackTrace();
    	}
    	
    	return realCommitActionList;
	}

	private void abortEdit(ISVNEditor editor) {
		try {
			editor.abortEdit();
		} catch (SVNException e) {
		    System.err.println("abortEdit() 异常");
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
	    		switch(action.getAction())
	    		{
	    		case ADD:	//add
	        		executeAddAction(editor,action);
	    			break;
	    		case DELETE: //delete
	    			executeDeleteAction(editor,action);
	    			break;
	    		case MODIFY: //modify
	    			executeModifyAction(editor,action);
	        		break;
				default:
					break;
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

		//printObject("executeModifyAction:",doc);
		
		String localPath = doc.getLocalRootPath();
		String localRefPath = doc.getLocalRefRootPath();

		String parentPath = doc.getPath();
		String remoteParentPath = doc.offsetPath +  doc.getPath();
		
		String entryName = doc.getName();
		System.out.println("executeModifyAction() " + remoteParentPath + entryName);
		
		
		InputStream oldData = null;
		if(localRefPath != null)
		{
			oldData = getFileInputStream(localRefPath + parentPath + entryName);
		}
		InputStream newData = getFileInputStream(localPath + parentPath + entryName);
    	boolean ret = false;
		if(action.isSubAction)
		{
			//subAction no need to openRoot and Parent
			ret = modifyFile(editor, remoteParentPath, entryName, oldData, newData,false,false);
		}
		else
		{
   			ret = modifyFile(editor, remoteParentPath, entryName, oldData, newData,false,true);       			
		}
		action.setResult(ret);
		
		if(oldData != null)
		{
			closeFileInputStream(oldData);
		}
		closeFileInputStream(newData);
		return ret;
	}

	private boolean executeDeleteAction(ISVNEditor editor, CommitAction action) {
		Doc doc = action.getDoc();

		String remoteParentPath = doc.offsetPath +  doc.getPath();
		String entryName = doc.getName();
		System.out.println("executeDeleteAction() " + remoteParentPath + entryName);

		boolean ret = deleteEntry(editor, remoteParentPath, entryName, false);
		action.setResult(ret);
		return ret;
	}
	
	private boolean executeAddAction(ISVNEditor editor, CommitAction action) {
		Doc doc = action.getDoc();

		String parentPath = doc.getPath();
		String remoteParentPath = doc.offsetPath +  parentPath;
		
		String entryName = doc.getName();
		
		String localRootPath = doc.getLocalRootPath();
		
		System.out.println("executeAddAction() " + remoteParentPath + entryName);

		boolean ret = false;

		//entry is file
		if(doc.getType() == 1)
		{
			String localEntryPath = localRootPath + parentPath + entryName;
    		
    		InputStream fileData = getFileInputStream(localEntryPath);
    		if(fileData == null)
    		{
    			action.setResult(false);
    			return false;
    		}
    		
    		if(action.isSubAction)
    		{
    			//No need to openParent
    			ret = addEntry(editor, remoteParentPath, entryName, true, fileData, false, false, false);
    		}
    		else
    		{	
    			ret = addEntry(editor, remoteParentPath, entryName, true, fileData, false, true, false);
    		}
    		action.setResult(ret);

    		closeFileInputStream(fileData);    		
    		return ret;
    	}
		
		//If entry is Dir we need to check if it have subActionList
    	if(action.isSubAction)	//No need to open the Root and Parent
    	{
    		if(action.getSubActionList() == null)	
    		{
    			ret = addEntry(editor, remoteParentPath, entryName, false, null, false, false, false);
        		action.setResult(ret);
        		return ret;
    		}
    		else //Keep the added Dir open until the subActionLis was executed
    		{	
    			if(addEntry(editor, remoteParentPath, entryName, false, null, false, false, true) == false)
    			{
            		action.setResult(false);
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
					action.setResult(false);
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
    			ret = addDir(editor, remoteParentPath, entryName);
    			action.setResult(ret);
    			return ret;
    		}
    		else //Keep the added Dir open until the subActionLis was executed
    		{	
    			//close the added Dir
    			try {
	    			editor.openDir(remoteParentPath,-1);
	    			
	    			if(addEntry(editor, remoteParentPath, entryName, false, null, false, false, true) == false)
	    			{
	    				action.setResult(false);
	    				return false;
	    			}
	    			
	    			if(executeCommitActionList(editor, action.getSubActionList(),false) == false)
	    			{
	    				return false;
	    			}
    				
					editor.closeDir();	//close new add Dir
					editor.closeDir();	//close parent
				} catch (SVNException e) {
					action.setResult(false);
					System.out.println("executeAddAction() closeDir failed");
					e.printStackTrace();
					return false;
				}
    			return true;
    		}
    	}
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
    	//System.out.println("addEntry() parentPath:" + parentPath + " entryName:" + entryName + " isFile:" + isFile);
    	
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
	    		//System.out.println("addEntry() checksum[" + checksum +"]");
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
    
	private boolean deleteEntry(ISVNEditor editor, String parentPath, String entryName, boolean openRoot)
    {   
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
	
	public boolean getRemoteFile(String remoteEntryPath, String localParentPath, String targetName, Long revision, boolean force) {
		File localEntry = new File(localParentPath + targetName);
		if(force == false)
		{
			if(localEntry.exists())
			{
				System.out.println("getRemoteFile() " + localParentPath+targetName + " 已存在");
				return false;
			}
			else
			{
				//检查父节点是否存在，不存在则自动创建
				FileUtil.checkAddLocalDirectory(localParentPath);
			}
		}
		else	//强行 checkOut
		{
			if(localEntry.exists())
			{
				if(localEntry.isDirectory())	//本地是目录，如果需要先删除
				{
					if(FileUtil.delFileOrDir(localParentPath+targetName) == false)
					{
						return false;
					}
				}
			}
			else
			{
				//检查父节点是否存在，不存在则自动创建
				FileUtil.checkAddLocalDirectory(localParentPath);
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
			System.out.println("getRemoteFile() getFile Exception:" + remoteEntryPath);
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
	
}
