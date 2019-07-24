package util.GitUtil;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import org.eclipse.jgit.api.CheckoutCommand;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.CommitCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ResetCommand.ResetType;
import org.eclipse.jgit.lib.ConfigConstants;
import org.eclipse.jgit.lib.Constants;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.PathFilter;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNNodeKind;
import org.tmatesoft.svn.core.io.ISVNEditor;
import org.tmatesoft.svn.core.io.diff.SVNDeltaGenerator;

import com.DocSystem.common.CommitAction;
import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;

import util.ReturnAjax;

public class GITUtil  extends BaseController{
    //For Low Level APIs
	private String repositoryURL = null;
	private String user = null;
	private String pwd = null;
	private String gitDir = null;
	private String wcDir = null;
	private boolean isRemote = false;
	
	public boolean Init(Repos repos,boolean isRealDoc, String commitUser) {
    	String localVerReposPath = getLocalVerReposPath(repos,isRealDoc);
    	System.out.println("GITUtil Init() localVerReposPath:" + localVerReposPath); 
		
		gitDir = localVerReposPath + ".git/";
		wcDir = localVerReposPath;
		
    	if(isRealDoc)
    	{
    		if(repos.getIsRemote() == 1)
    		{
    			isRemote = true;
    			repositoryURL = repos.getSvnPath();
    			user = repos.getSvnUser();
    			pwd = repos.getSvnPwd();
    		}
    	}
    	else
    	{
    		if(repos.getIsRemote1() == 1)
    		{
    			isRemote = true;
    			repositoryURL = repos.getSvnPath1();
    			user = repos.getSvnUser1();
    			pwd = repos.getSvnPwd1();
    		}
    	}

		//Set user to commitUser if user is null
		if(user==null || "".equals(user))
		{
			user = commitUser;
		}
		return true;
	}
	
    //新建本地git仓库
	public String CreateRepos(){
		System.out.println("CreateRepos");
		
		File dir = new File(gitDir);
		File wcdir = new File(wcDir);
        try {
			Git.init().setGitDir(dir).setDirectory(wcdir).call();
		} catch (Exception e) {
			e.printStackTrace();
			System.out.println("CreateRepos error");
			return null;
		}
        
        return wcDir;
	}
	
    //Clone仓库: clone到path + name目录下
	public String CloneRepos(){
		System.out.println("CloneRepos");
		
		CloneCommand cloneCommand = Git.cloneRepository();
		cloneCommand.setURI(repositoryURL);
		
		if(user != null)
		{
			cloneCommand.setCredentialsProvider( new UsernamePasswordCredentialsProvider(user, pwd));
		}
		
		File dir = new File(gitDir);
		cloneCommand.setGitDir(dir);	//Set the repository dir
		//File wcdir = new File(wcDir);
        //cloneCommand.setDirectory(wcdir);	//set the working copy dir
		
		try {
			cloneCommand.call();
		} catch (Exception e) {
			System.out.println("CloneRepos error");
			e.printStackTrace();
			return null;
		}
        
        return wcDir;
	}
    
    public String getLatestRevision() 
	{
    	String revision = "HEAD";
        
		try {
    	    Git git = Git.open(new File(gitDir));

            Repository repository = git.getRepository();
            
            RevWalk walk = new RevWalk(repository);

            //Get objId for revision
            ObjectId objId = repository.resolve(revision);
            if(objId == null)
            {
            	System.out.println("getLatestRevision() There is no any commit history for:" + revision);
                walk.close();
            	return null;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);        
            
            walk.close();
            return revCommit.getName();
            
		} catch (IOException e) {
			System.out.println("getLatestRevision() Exception");
        	
			e.printStackTrace();
			return null;
		}
	}
	
	//getHistory filePath: remote File Path under repositoryURL
    public Doc getDoc(Doc doc, String revision) 
    {
    	String entryPath = doc.getPath() + doc.getName();
    	
    	Integer type = checkPath(entryPath, revision);
    	if(type == null)
    	{
    		return null;
    	}
    	
        if(type ==  0) 
		{
	    	System.out.println("getDoc() " + entryPath + " not exist for revision:" + revision); 
	    	Doc remoteEntry = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), doc.getLevel(), 0, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
			return remoteEntry;
		}
    	
    	Git git = null;
		try {
	    	git = Git.open(new File(wcDir));
	    	
		    Iterable<RevCommit> iterable = null;
		    if(entryPath == null || entryPath.isEmpty())
		    {
		    	iterable = git.log().setMaxCount(1).call();
		    }
		    else
		    {
		    	iterable = git.log().addPath(entryPath).setMaxCount(1).call();
		    }
		    
		    Iterator<RevCommit> iter=iterable.iterator();
	        while (iter.hasNext()){
	            RevCommit commit=iter.next();	

	            String commitId=commit.getName();  //revision
	            String author=commit.getAuthorIdent().getName();  //作者
	            String commitUser=commit.getCommitterIdent().getName();
	            long commitTime=commit.getCommitTime();
	            
	            //String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
	            Doc remoteDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), doc.getLevel(), 0, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
				remoteDoc.setRevision(commitId);
	            remoteDoc.setCreatorName(author);
	            remoteDoc.setLatestEditorName(commitUser);
	            remoteDoc.setLatestEditTime(commitTime);
	            return remoteDoc;
	        }
	        
	        return null;
	    } catch (Exception e) {
			System.out.println("getDoc Error");	
			e.printStackTrace();
			return null;
		}
    }
    
	//getHistory filePath: remote File Path under repositoryURL
    public List<LogEntry> getHistoryLogs(String filePath,String startRevision, String endRevision,int maxLogNum) 
    {
    	System.out.println("getHistoryLogs filePath:" + filePath);	

    	Git git = null;
		try {
	    	List<LogEntry> logList = new ArrayList<LogEntry>();
			
	    	git = Git.open(new File(wcDir));
	    	
		    Iterable<RevCommit> iterable = null;
		    if(filePath == null || filePath.isEmpty())
		    {
		    	iterable = git.log().setMaxCount(maxLogNum).call();
		    }
		    else
		    {
		    	iterable = git.log().addPath(filePath).setMaxCount(maxLogNum).call();
		    }
		    
		    Iterator<RevCommit> iter=iterable.iterator();
	        while (iter.hasNext()){
	            RevCommit commit=iter.next();
	            //String authorEmail=commit.getAuthorIdent().getEmailAddress();
	            //String author=commit.getAuthorIdent().getName();  //作者
	
	            String commitUser=commit.getCommitterIdent().getName();
	            //String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
	
	            long commitTime=commit.getCommitTime();
	
	            String fullMessage=commit.getFullMessage();
	            //String shortMessage=commit.getShortMessage();  //返回message的firstLine
	
	            String commitId=commit.getName();  //这个应该就是提交的版本号
	
//	            System.out.println("authorEmail:"+authorEmail);
//	            System.out.println("authorName:"+author);
//	            System.out.println("commitEmail:"+commitUserEmail);
//	            System.out.println("commitName:"+commitUser);
//	            System.out.println("time:"+commitTime);
//	            System.out.println("fullMessage:"+fullMessage);
//	            System.out.println("shortMessage:"+shortMessage);
//	            System.out.println("commitId:"+commitId);
	            
	            LogEntry log = new LogEntry();
	            log.setCommitId(commitId);
	            log.setCommitUser(commitUser);
	            log.setCommitMsg(fullMessage);
	            log.setCommitTime(commitTime);
	            logList.add(log);
	        }
	        
	        return logList;
	    } catch (Exception e) {
			System.out.println("getHistoryLogs Error");	
			e.printStackTrace();
			return null;
		}
    }
    
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public List<Doc> getDocList(Repos repos, Doc doc, String revision)
	{
    	System.out.println("getSubEntryList() revision:" + revision);
    	if(revision == null || revision.isEmpty())
        {
        	revision = "HEAD";
        }
    	
    	Repository repository = null;
        try {
            //gitDir表示git库目录
        	Git git = Git.open(new File(gitDir));
            repository = git.getRepository();
            
            //New RevWalk
            RevWalk walk = new RevWalk(repository);

            //Get objId for revision
            ObjectId objId = repository.resolve(revision);
            if(objId == null)
            {
            	System.out.println("There is no any commit history for:" + revision);
            	walk.close();
            	repository.close();
            	return null;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);
            String commitId = revCommit.getName();	//revision
            long commitTime = revCommit.getCommitTime();	//commitTime
            System.out.println("revCommit revision:" + revCommit.getName());
            System.out.println("revCommit commitTime:" + revCommit.getType());
            System.out.println("revCommit commitMsg:" + revCommit.getShortMessage());
            
            RevTree revTree = revCommit.getTree();
            System.out.println("revTree name:" + revTree.getName());
            System.out.println("revTree id:" + revTree.getId());
            
            TreeWalk treeWalk = getTreeWalkByPath(repository, revTree, doc.getPath() + doc.getName());
            List <Doc> subEntryList =  null;
            if(treeWalk != null) 
            {
        		String subDocParentPath = doc.getPath() + doc.getName() + "/";
        		if(doc.getDocId() == 0)
        		{
        			subDocParentPath = "";
        		}
        		int subDocLevel = doc.getLevel() + 1;
            	
            	subEntryList =  new ArrayList<Doc>();
            	while(treeWalk.next())
            	{
            		int type = getTypeFromFileMode(treeWalk.getFileMode(0));
            		if(type > 0)
            		{
            			String name = treeWalk.getNameString();
            			ObjectId objId1 = treeWalk.getObjectId(0);
            			RevCommit revCommit1 = walk.parseCommit(objId1);
            			String revision1 = revCommit1.getName();
            			System.err.println("commitId:" + commitId + "revision1:" + revision1);
            			
                		Doc subDoc = new Doc();
                		subDoc.setVid(repos.getId());
                		subDoc.setDocId(buildDocIdByName(subDocLevel,subDocParentPath,name));
                		subDoc.setPid(doc.getDocId());
                		subDoc.setPath(subDocParentPath);
                		subDoc.setName(name);
                		subDoc.setLevel(subDocLevel);
                		subDoc.setType(type);
                		//subEntry.setSize();
                		//subEntry.setCreateTime();
                		subDoc.setLatestEditTime(commitTime);
                		subDoc.setRevision(commitId);
                		subEntryList.add(subDoc);
            		}
            	}
            }
            walk.close();
            repository.close();
            
            return subEntryList;
        } catch (Exception e) {
           System.out.println("ReposTreeWalk() Exception"); 
           e.printStackTrace();
           return null;
        }
	}
	
	private TreeWalk getTreeWalkByPath(Repository repository, RevTree revTree, String path) {
		
		try {
			TreeWalk tw = new TreeWalk(repository,  repository.newObjectReader());
    		tw.reset(revTree);
	    	tw.setRecursive(false);
	    	if(path == null || path.isEmpty())
	    	{
	    		return tw;
	    	}
	    	
	    	//Find out the treeWalk for Path
	    	tw = findTreeWalkForPath(tw, path);
	    	return tw;
		} catch (Exception e) {
			System.out.println("getTreeWalkByPath() Exception!"); 
			e.printStackTrace();
			return null;
		}
	}

	private TreeWalk findTreeWalkForPath(TreeWalk treeWalk, String path) {
		//Split the path by "/"
		String [] paths = path.split("/");
		int deepth = paths.length;
		for(int i=0; i< deepth; i++)
		{
			System.out.println("paths:" + paths[i]);
		}
		
		int curLevel = 0;
    	try {
			while (treeWalk.next()) 
			{
				String entryName = treeWalk.getNameString();
				if(entryName.equals(paths[curLevel]))
				{
					if(curLevel < deepth-1)
					{
						if(treeWalk.isSubtree()) 
						{
							treeWalk.enterSubtree();
							curLevel ++;
						}
						else
						{
							return null;
						}
					}
					else
					{
						//Find the treeWalk
						return treeWalk;
					}
				}
			}
		} catch (Exception e) {
			System.out.println();
			e.printStackTrace();
		}
    	return null;
	}

	public List<Doc> getEntry(Doc doc, String localParentPath, String targetName,String revision, boolean force) {
		String parentPath = doc.getPath();
		String entryName = doc.getName(); 
		System.out.println("getEntry() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
		//check targetName and set
		if(targetName == null)
		{
			targetName = entryName;
		}
		
        if(revision == null || revision.isEmpty())
        {
        	revision = "HEAD";
        }
				
		Repository repository = null;
        try {
            //gitDir表示git库目录
        	Git git = Git.open(new File(gitDir));
            repository = git.getRepository();
            
            //New RevWalk
            RevWalk walk = new RevWalk(repository);

            //Get objId for revision
            ObjectId objId = repository.resolve(revision);
            
            RevCommit revCommit = walk.parseCommit(objId);
            RevTree revTree = revCommit.getTree();
    		
            TreeWalk treeWalk = null;
            if(entryName.isEmpty())
            {
            	//Get treeWalk For whole repos
            	treeWalk = new TreeWalk( repository );
                treeWalk.setRecursive(false);
                treeWalk.reset(revTree);
            }
            else
            {   
            	treeWalk = new TreeWalk(repository, repository.newObjectReader());
                PathFilter pathFileter = PathFilter.create(parentPath+entryName);
                treeWalk.setFilter(pathFileter);
                treeWalk.reset(revTree);
                treeWalk.setRecursive(false);
            }
            List<Doc> ret = recurGetEntry(git, repository, treeWalk, doc, localParentPath, targetName);
            walk.close();
            repository.close();
            return ret;
        } catch (Exception e) {
           System.out.println("getEntry() Exception"); 
           e.printStackTrace();
           return null;
        }
	}

	public TreeWalk getTreeWalkByPath(String entryPath, String revision) throws Exception
	{
		Git git = Git.open(new File(gitDir));
		Repository repository = git.getRepository();
        
        //New RevWalk
        RevWalk walk = new RevWalk(repository);

        //Get objId for revision
        ObjectId objId = repository.resolve(revision);
        if(objId == null)
        {
        	System.err.println("getTreeWalkByPath() there is no any history for:" + entryPath);
        	walk.close();
        	repository.close();
        	return null;
        }
        
        RevCommit revCommit = walk.parseCommit(objId);
        RevTree revTree = revCommit.getTree();
                
        //child表示相对git库的文件路径
        TreeWalk treeWalk = TreeWalk.forPath(repository, entryPath, revTree);
        
        walk.close();
        repository.close();
        return treeWalk;
	}
	
	
	public Integer checkPath(String entryPath, String revision) 
	{
		if(revision == null)
		{
			revision = "HEAD";
		}
		
		//It is root dir
		if(entryPath.isEmpty())
		{
			System.err.println("checkPath() " + entryPath +" is root");
			return 2;
		}
		
		try {
	        TreeWalk treeWalk = getTreeWalkByPath(entryPath, revision);
	        if(treeWalk == null)
	        {
	        	return 0;
	        }
	        
	        int type = getTypeFromFileMode(treeWalk.getFileMode());
        	return type;
		} catch (Exception e) {
			System.err.println("checkPath() 异常");
			e.printStackTrace();
			return null;
		}
	}
	
	private int getTypeFromFileMode(FileMode fileMode)
	{
		int bits = fileMode.getBits();
		switch(bits & FileMode.TYPE_MASK)
		{
		case FileMode.TYPE_FILE:
			return 1;
		case FileMode.TYPE_TREE:
			return 2;
		case FileMode.TYPE_MISSING:
			return 0;
		}
		return -1;
	}
	
	private boolean isFile(FileMode fileMode)
	{
		return (fileMode.getBits() & FileMode.TYPE_MASK) == FileMode.TYPE_FILE? true: false;
	}
	
	private boolean isDir(FileMode fileMode)
	{
		return (fileMode.getBits() & FileMode.TYPE_MASK) == FileMode.TYPE_TREE? true: false;
	}
	
	private boolean isMissing(FileMode fileMode)
	{
		return (fileMode.getBits() & FileMode.TYPE_MASK) == FileMode.TYPE_MISSING? true: false;
	}
	
	private List<Doc> recurGetEntry(Git git, Repository repository, TreeWalk treeWalk, Doc doc, String localParentPath, String targetName) {
		
		String parentPath = doc.getPath();
		String entryName = doc.getName();
		System.out.println("recurGetEntry() parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
		List<Doc> successDocList = new ArrayList<Doc>();
    	if(parentPath == null || entryName == null)
    	{
    		System.out.println("getEntry() 非法参数：parentPath or entryName is null!");
    		return null;
    	}
    	
		try {
			FileMode fileMode = treeWalk.getFileMode();
	        if(isFile(fileMode))
	        {
	        	System.out.println("recurGetEntry() " + treeWalk.getNameString() + " isFile:" + fileMode.getBits());

	            FileOutputStream out = null;
	    		try {
	    			out = new FileOutputStream(localParentPath + targetName);
	    		} catch (Exception e) {
	    			System.out.println("recurGetEntry() new FileOutputStream Failed:" + localParentPath + targetName);
	    			e.printStackTrace();
	    			return null;
	    		}
	
	            ObjectId blobId = treeWalk.getObjectId(0);
	            ObjectLoader loader = repository.open(blobId);
	            loader.copyTo(out);
	            out.close();
	            
	            doc.setType(1);
	            successDocList.add(doc);
	            return successDocList;
	        }
	        else if(isDir(fileMode))
	        {
	        	System.out.println("recurGetEntry() " + treeWalk.getNameString() + " isDir:" + fileMode.getBits());

	        	File dir = new File(localParentPath,targetName);
				dir.mkdir();
				
				while(treeWalk.next())
				{
					String subEntryName = treeWalk.getNameString();
					String subParentPath = parentPath + entryName +"/";
					String subLocalParentPath = localParentPath + targetName + "/";
					
					Doc subDoc = new Doc();
					subDoc.setVid(doc.getVid());
					subDoc.setPath(subParentPath);
					subDoc.setName(subEntryName);
					subDoc.setRevision(doc.getRevision());
					List<Doc> subSuccessList = recurGetEntry(git, repository, treeWalk, subDoc, subLocalParentPath, subEntryName);
					if(subSuccessList != null && subSuccessList.size() > 0)
					{
						successDocList.addAll(subSuccessList);
					}
				}
				return successDocList;
	        }
	        else 
	        {
	        	System.out.println("recurGetEntry() unknown FileMode:" + fileMode.getBits());
	        	return null;
	        }
        }catch (Exception e) {
            System.out.println("recurGetEntry() Exception"); 
            e.printStackTrace();
            return null;
        }
    }
	
    //Get the Entry from git Repository
 	public boolean getFile(String localFilePath, String parentPath, String entryName, String commitId) {

 		System.out.println("getFile() parentPath:" + parentPath + " entryName:" + entryName + " commitId:" + commitId );
 		String remoteFilePath = parentPath + entryName;
 		

        FileOutputStream out = null;
		try {
			out = new FileOutputStream(localFilePath);
		} catch (FileNotFoundException e) {
			System.out.println("getFile() new FileOutputStream Failed:" + localFilePath);
			e.printStackTrace();
			return false;
		}
		
		Repository repository = null;
        try {
            //gitDir表示git库目录
        	Git git = Git.open(new File(gitDir));
            repository = git.getRepository();
            
            RevWalk walk = new RevWalk(repository);
            
            ObjectId objId = repository.resolve(commitId);
            RevCommit revCommit = walk.parseCommit(objId);
            RevTree revTree = revCommit.getTree();

            //child表示相对git库的文件路径
            TreeWalk treeWalk = TreeWalk.forPath(repository, remoteFilePath, revTree);
            ObjectId blobId = treeWalk.getObjectId(0);
            ObjectLoader loader = repository.open(blobId);
            loader.copyTo(out);
            walk.close();
            repository.close();
            return true;
        } catch (Exception e) {
           System.err.println("getFile() 异常"); 
           e.printStackTrace();
           return false;
        }        
 	}
 	
	//Commit will commit change to Git Repos and Push to remote
	public String Commit(Doc doc, String commitMsg, String commitUser) {
		System.out.println("Commit() " + doc.getPath() + doc.getName());	

        Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("Commit() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return null;
		}
		
		String entryPath = doc.getPath() + doc.getName();
		try {	
			if(entryPath.isEmpty())
			{
		        git.add().addFilepattern(".").call();
			}
			else
			{
				git.add().addFilepattern(entryPath).call();
			}
		} catch (Exception e) {
			System.out.println("Commit() Commit add Index Error");	
			e.printStackTrace();
			//Do roll back WorkingCopy
			rollBackIndex(git, entryPath, null);	
			return null;
		}
		
		RevCommit ret = null;
        try {
			ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("Commit() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("Commit() commit error");
			e.printStackTrace();
			//Do roll back Index
			rollBackIndex(git, entryPath, null);			
			return null;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				System.out.println("Push Error");	
				e.printStackTrace();
				//Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					rollBackIndex(git, entryPath, null);
				}
				return null;
			}
		}
		
        return ret.getName();
	}
	
	private boolean rollBackCommit(Git git,String revision) {
		if(revision == null || revision.isEmpty()) 
		{
			revision = "HEAD";
		}

		try {
			Repository repository = git.getRepository();
	        RevWalk walk = new RevWalk(repository);
			ObjectId objId = repository.resolve(revision);
			RevCommit revCommit = walk.parseCommit(objId);  
	        String preVision = revCommit.getParent(0).getName();  
	        git.reset().setMode(ResetType.HARD).setRef(preVision).call();  
	        walk.close();
	        repository.close(); 
		} catch (Exception e) {
			System.out.println("rollBackCommit() Exception");
			e.printStackTrace();
			return false;
		}
		return true;
	}

	//将工作区和暂存区恢复指定版本（revision==null表示恢复到最新版本）
    private boolean rollBackIndex(Git git, String entryPath, String revision) {
		//checkout操作会丢失工作区的数据，暂存区和工作区的数据会恢复到指定（revision）的版本内容
        CheckoutCommand checkoutCmd = git.checkout();
        checkoutCmd.addPath(entryPath);
        //加了“^”表示指定版本的前一个版本，如果没有上一版本，在命令行中会报错，例如：error: pathspec '4.vm' did not match any file(s) known to git.
        checkoutCmd.setStartPoint(revision);
        
        try {
			checkoutCmd.call();
		} catch (Exception e) {
			System.out.println("rollBackIndex() Exception");
			e.printStackTrace();
			return false;
		}
        return true;
	}

	public String gitMove(Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser) {
		
		String wcSrcDocParentPath = srcDoc.getLocalRootPath() + srcDoc.getPath();
		String wcDstDocParentPath = dstDoc.getLocalRootPath() + dstDoc.getPath();

		if(moveFileOrDir(wcSrcDocParentPath, srcDoc.getName() ,wcDstDocParentPath, dstDoc.getName(),false) == false)
		{
			System.out.println("gitDocMove() moveFileOrDir Failed");					
			return null;
		}
				
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("gitMove() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return null;
		}

		String srcEntryPath = srcDoc.getPath() + srcDoc.getName();
		String dstEntryPath = dstDoc.getPath() + dstDoc.getName();

		//Add Index for delete srcEntry
		try {	
			git.add().addFilepattern(srcEntryPath).call();
		} catch (Exception e) {
			System.out.println("gitMove() add Index for srcEntry delete Failed");	
			e.printStackTrace();
			//Do roll back WorkingCopy for srcEntry
			rollBackIndex(git, srcEntryPath, null);
			return null;
		}
		
		//Add Index for add dstEntry
		try {	
			git.add().addFilepattern(dstEntryPath).call();
		} catch (Exception e) {
			System.out.println("gitMove() add Index for dstEntry add Failed");	
			e.printStackTrace();
			//Do roll back WorkingCopy for srcEntry and dstEntry
			rollBackIndex(git, srcEntryPath, null);
			delFileOrDir(dstEntryPath);
			return null;
		}
		
		RevCommit ret = null;
        try {
			ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("gitMove() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("gitMove() commit error");
			e.printStackTrace();
			//Do roll back Index
			rollBackIndex(git, srcEntryPath, null);
			if(true == rollBackIndex(git, dstEntryPath, null))
			{
				delFileOrDir(dstEntryPath);
			}	
			return null;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				System.out.println("gitAdd() Push Error");	
				e.printStackTrace();
				//Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					rollBackIndex(git, srcEntryPath, null);
					if(rollBackIndex(git, dstEntryPath, null))
					{
						delFileOrDir(dstEntryPath);
					}
				}
				return null;
			}
		}
		
		return ret.getName();
	}

	public String gitCopy(String srcParentPath, String srcEntryName, String dstParentPath, String dstEntryName,
			String commitMsg, String commitUser) {
		System.out.println("gitCopy() copy " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName);	
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("gitCopy() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return null;
		}

		String dstEntryPath = dstParentPath + dstEntryName;
		
		//Add Index for add dstEntry
		try {	
			git.add().addFilepattern(dstEntryPath).call();
		} catch (Exception e) {
			System.out.println("gitCopy() add Index for dstEntry add Failed");	
			e.printStackTrace();
			//Do roll back WorkingCopy for srcEntry and dstEntry
			delFileOrDir(dstEntryPath);
			return null;
		}
		
		RevCommit ret = null;
        try {
			ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("gitCopy() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("gitCopy() commit error");
			e.printStackTrace();
			//Do roll back Index
			if(true == rollBackIndex(git, dstEntryPath, null))
			{
				delFileOrDir(dstEntryPath);
			}	
			return null;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				System.out.println("gitCopy() Push Error");	
				e.printStackTrace();
				//Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					if(rollBackIndex(git, dstEntryPath, null))
					{
						delFileOrDir(dstEntryPath);
					}
				}
				return null;
			}
		}
		
		return ret.getName();
	}

	public String doAutoCommit(Doc doc, String commitMsg,String commitUser, boolean modifyEnable, HashMap<Long, Doc> commitHashMap, int subDocCommitFlag) 
	{		
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
			System.err.println("doAutoCommit() checkPath for " + doc.getPath() + " 异常");
			return null;
		}
		
		if(type == 0)
		{
			System.err.println("doAutoCommit() parent entry " + doc.getPath() + " not exists, do commit parent");
			return doAutoCommitParent(doc, commitMsg, commitUser, modifyEnable);
		}	
			
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
		        return getLatestRevision();
		    }
		    
		    return deleteDoc(doc, commitMsg, commitUser);
		}

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
		    	return addFileEx(doc, commitMsg, commitUser, false);
		    }
		    else if(type != 1)
		    {
		    	return addFileEx(doc, commitMsg, commitUser, true);
		    }
		    else
		    {
		       return modifyFile(doc, commitMsg, commitUser);
		    }
		}

		//LocalEntry is Directory
		System.out.println("doAutoCommit() localEntry " + localRootPath + entryPath + " is Directory");
		List <CommitAction> commitActionList = new ArrayList<CommitAction>();
		scheduleForCommit(commitActionList, doc, localRootPath, localRefRootPath, modifyEnable, false, commitHashMap, subDocCommitFlag);
				                
	    if(commitActionList == null || commitActionList.size() ==0)
	    {
	    	System.out.println("doAutoCommmit() There is nothing to commit");
	        return getLatestRevision();
	    }
	    
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("doAutoCommit() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return null;
		}
		
	    if(executeCommitActionList(git,commitActionList,true) == false)
	    {
	    	System.out.println("doAutoCommit() executeCommitActionList Failed");
	    	git.close();
	        return null;
	    }
	    
        RevCommit ret = null;
        try {
			ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("doAutoCommmit() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("doAutoCommmit() commit error");
			e.printStackTrace();
			//Do roll back Index
			if(true == rollBackIndex(git, entryPath, null))
			{
				rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录
			}	
			return null;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				System.out.println("doAutoCommmit() Push Error");	
				e.printStackTrace();
				//Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					if(rollBackIndex(git, entryPath, null))
					{
						rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录
					}
				}
				return null;
			}
		}
		return ret.getName();
	}

	private boolean executeCommitActionList(Git git, List<CommitAction> commitActionList,boolean openRoot) {
    	System.out.println("executeCommitActionList() szie: " + commitActionList.size());
		try {
	    	for(int i=0;i<commitActionList.size();i++)
	    	{
	    		CommitAction action = commitActionList.get(i);
	    		boolean ret = false;
	    		switch(action.getAction())
	    		{
	    		case 1:	//add
	        		ret = executeAddAction(git,action);
	    			break;
	    		case 2: //delete
	    			ret = executeDeleteAction(git,action);
	    			break;
	    		case 3: //modify
	    			ret = executeModifyAction(git,action);
	        		break;
	    		}
	    		if(ret == false)
	    		{
	    			System.out.println("executeCommitActionList() failed");	
	    			return false;
	    		} 
	    	}
	    	
	    	return true;
		} catch (Exception e) {
			System.out.println("executeCommitActionList() 异常");	
			e.printStackTrace();
			return false;
		}
	}
	
	private boolean executeModifyAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();
		
		System.out.println("executeModifyAction() parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localRootPath:" + doc.getLocalRootPath());
		
		
		boolean ret = modifyFile(git, doc);
		return ret;
	}

	private boolean executeDeleteAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();

		System.out.println("executeDeleteAction() parentPath:" + doc.getPath() + " entryName:" + doc.getName());
		return deleteEntry(git, doc);
	}
	
	private boolean executeAddAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();
		
		System.out.println("executeAddAction() parentPath:" + doc.getPath() + " entryName:" + doc.getName());
		
		//entry is file
		if(doc.getType() == 1)
		{
			return addEntry(git, doc);
		}
		
    	if(action.getSubActionList() == null)	
    	{
    		return addEntry(git, doc);
    	}
    	else //Keep the added Dir open until the subActionLis was executed
    	{	
    		if(addEntry(git, doc) == false)
    		{
    			return false;
    		}
    			
    		if(executeCommitActionList(git, action.getSubActionList(),false) == false)
    		{
    			return false;
    		}
    		return true;
    	}
  	}

    //doModifyFile
    private boolean modifyFile(Git git, Doc doc)
    {
    	//Add to Doc to WorkingDirectory
    	String entryPath = doc.getPath() + doc.getName();
    	String docPath = doc.getLocalRootPath() + entryPath;
		String wcDocPath = wcDir + entryPath;
    	
    	if(copyFile(docPath, wcDocPath, false) == false)
		{
			System.err.println("modifyFile() copy File to WD error");					
			return false;
		}
    	
    	try {	
			git.add().addFilepattern(entryPath).call();
		} catch (Exception e) {
			System.err.println("addEntry() add Index Error");	
			e.printStackTrace();
			return false;
		}
		return true;
    }
    
	private boolean deleteEntry(Git git, Doc doc) 
	{
		//Add to Doc to WorkingDirectory
		String entryPath = doc.getPath() + doc.getName();
		String wcDocPath = wcDir + entryPath;
		if(delFileOrDir(wcDocPath) == false)
		{
			System.err.println("deleteEntry() delete WD Error");	
			return false;
		}
		
		try {	
			git.add().addFilepattern(entryPath).call();
		} catch (Exception e) {
			System.err.println("addEntry() add Index Error");	
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public boolean addEntry(Git git, Doc doc) 
	{
		//Add to Doc to WorkingDirectory
		String entryPath = doc.getPath() + doc.getName();
		String docPath = doc.getLocalRootPath() + entryPath;
		String wcDocPath = wcDir + entryPath;
		if(doc.getType() == 1)
		{
			if(copyFile(docPath, wcDocPath, false) == false)
			{
				System.err.println("addEntry() add File to WD error");					
				return false;
			}
		}
		else
		{
			//Add Dir
			File dir = new File(wcDocPath);
			if(dir.mkdir() == false)
			{
				System.err.println("addEntry() add Dir to WD error");										
				return false;
			}
		}
		
		try {	
			git.add().addFilepattern(entryPath).call();
		} catch (Exception e) {
			System.err.println("addEntry() add Index Error");	
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public String moveDoc(Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		return null;
	}

	public String copyDoc(Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		return null;
	}


	private void scheduleForCommit(List<CommitAction> actionList, Doc doc, String localRootPath, String localRefRootPath,boolean modifyEnable,boolean isSubAction, HashMap<Long, Doc> commitHashMap, int subDocCommitFlag) {
		System.out.println("scheduleForCommit()  parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localRootPath:" + localRootPath + " localRefRootPath:" + localRefRootPath + " modifyEnable:" + modifyEnable + " subDocCommitFlag:" + subDocCommitFlag);
		
    	if(doc.getName().isEmpty())
    	{
    		scanForSubDocCommit(actionList, doc, localRootPath, localRefRootPath, modifyEnable, isSubAction, commitHashMap, subDocCommitFlag);
    		return;
    	}
 	
    	String entryPath = doc.getPath() + doc.getName();
    	String localEntryPath = localRootPath + entryPath;    	
    	File localEntry = new File(localEntryPath);

		Integer type = checkPath(entryPath, null);
    	if(type == null)
    	{
    		System.out.println("scheduleForCommit() checkPath 异常!");
			return;
		}
    	
    	//本地删除
    	if(!localEntry.exists())
    	{
    		if(type == 0)
    		{
    			//已同步
    			return;
    		}
    		insertDeleteAction(actionList,doc);
    		return;
    	}
    	
    	//本地存在
    	int localEntryType = localEntry.isDirectory()? 2:1;
    	switch(localEntryType)
    	{
    	case 1:	//文件
    		if(type == 0) 	//新增文件
	    	{
    			insertAddFileAction(actionList,doc,isSubAction);
	            return;
    		}
    		
    		if(type != 1)	//文件类型改变
    		{
    			insertDeleteAction(actionList,doc);
    			insertAddFileAction(actionList,doc,isSubAction);
	            return;
    		}
    		
    		//如果commitHashMap未定义，那么文件是否commit由modifyEnable标记决定
    		if(commitHashMap == null) //文件内容改变	
    		{
	            if(modifyEnable)
	            {
            		System.out.println("scheduleForCommit() insert " + entryPath + " to actionList for Modify" );
            		insertModifyFile(actionList,doc);
            		return;
            	}
    		}
    		else
    		{
    			Doc tempDoc = commitHashMap.get(doc.getDocId());
    			if(tempDoc != null)
    			{
        			System.out.println("scheduleForCommit() insert " + entryPath + " to actionList for Modify" );
            		insertModifyFile(actionList,doc);
            		return;
    			}
    		}
    		break;
    	case 2:
    		if(type == 0) 	//新增目录
	    	{
    			//Add Dir
    			insertAddDirAction(actionList,doc,isSubAction);
	            return;
    		}
    		
    		if(type != 2)	//文件类型改变
    		{
    			insertDeleteAction(actionList,doc);
	        	insertAddDirAction(actionList,doc, isSubAction);
	            return;
    		}
    		
    		scanForSubDocCommit(actionList, doc, localRootPath, localRefRootPath, modifyEnable, isSubAction, commitHashMap, subDocCommitFlag);
    		break;
    	}
    	return; 
	}

	private void scanForSubDocCommit(List<CommitAction> actionList, Doc doc, String localRootPath,
			String localRefRootPath, boolean modifyEnable, boolean isSubAction, HashMap<Long, Doc> commitHashMap,
			int subDocCommitFlag) {

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
		
		//遍历仓库所有子目录
    	File remoteEntry = new File(wcDir + doc.getPath() + doc.getName());
    	File[] entries = remoteEntry.listFiles();
				
		String subDocParentPath = doc.getPath() + doc.getName() + "/";
		if(doc.getDocId() == 0)
		{
			 subDocParentPath = doc.getPath();
		}
		int subDocLevel = doc.getLevel() + 1;

        if(entries != null)
        {
    		for(int i=0;i<entries.length;i++)
    		{
	            File remoteSubEntry = entries[i];
	            int subDocType = remoteSubEntry.isFile()? 1:2;
	            Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subDocParentPath, remoteSubEntry.getName(), subDocLevel, subDocType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), remoteSubEntry.length(), "");
	            docHashMap.put(subDoc.getDocId(), subDoc);
	            scheduleForCommit(actionList, subDoc, localRootPath, localRefRootPath, modifyEnable, isSubAction, commitHashMap, subDocCommitFlag);
	        }
        }
        
        //Go Through localSubDocs
        File dir = new File(localRootPath);
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

	private String modifyFile(Doc doc, String localRootPath, String localRefRootPath) {
		// TODO Auto-generated method stub
		return null;
	}

	private String addFileEx(Doc doc, String localRootPath, String commitMsg, boolean b) {
		// TODO Auto-generated method stub
		return null;
	}

	private String doAutoCommitParent(Doc doc, String commitMsg, String commitUser, boolean modifyEnable) {
		// TODO Auto-generated method stub
		return null;
	}

	private void rollBackWcDir(List<CommitAction> commitActionList) {
    	for(int i=0;i<commitActionList.size();i++)
    	{
    		CommitAction action = commitActionList.get(i);
    		Doc doc = action.getDoc();
    		if(1 == action.getAction()) //add
    		{
        		delFileOrDir(wcDir + doc.getPath() + doc.getName());
    		}
    	}
	}

	public List<ChangedItem> getHistoryDetail(Doc doc, String commitId) {
		// TODO Auto-generated method stub
		return null;
	}	
	
	protected String gitDocCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		System.out.println("gitDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		
		if(srcEntryName == null || srcEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() srcEntryName can not be empty");
			return null;
		}

		if(dstEntryName == null || dstEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() dstEntryName can not be empty");
			return null;
		}
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitDocCopy() GITUtil Init failed");
			return null;
		}
	
		//Do move at Working Directory
		String wcSrcDocParentPath = getLocalVerReposPath(repos, isRealDoc) + srcParentPath;
		String wcDstParentDocPath = getLocalVerReposPath(repos, isRealDoc) + dstParentPath;	
		if(copyFileOrDir(wcSrcDocParentPath+srcEntryName,wcDstParentDocPath+dstEntryName,false) == false)
		{
			System.out.println("gitDocCopy() moveFileOrDir Failed");					
			return null;
		}
				
		//Commit will roll back WC if there is error
		return gitUtil.gitCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser);
	}

	public String copyDoc(Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, boolean b) {
		// TODO Auto-generated method stub
		return null;
	}
}
