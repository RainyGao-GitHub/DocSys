package util.GitUtil;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.eclipse.jgit.api.CheckoutCommand;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.CommitCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ResetCommand.ResetType;
import org.eclipse.jgit.api.RevertCommand;
import org.eclipse.jgit.api.errors.AbortedByHookException;
import org.eclipse.jgit.api.errors.CheckoutConflictException;
import org.eclipse.jgit.api.errors.ConcurrentRefUpdateException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRefNameException;
import org.eclipse.jgit.api.errors.JGitInternalException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.api.errors.NoMessageException;
import org.eclipse.jgit.api.errors.RefAlreadyExistsException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.api.errors.UnmergedPathsException;
import org.eclipse.jgit.api.errors.WrongRepositoryStateException;
import org.eclipse.jgit.errors.AmbiguousObjectException;
import org.eclipse.jgit.errors.IncorrectObjectTypeException;
import org.eclipse.jgit.errors.RevisionSyntaxException;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.tmatesoft.svn.core.SVNCommitInfo;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNLogEntry;
import org.tmatesoft.svn.core.SVNLogEntryPath;
import org.tmatesoft.svn.core.SVNNodeKind;
import org.tmatesoft.svn.core.SVNProperties;
import org.tmatesoft.svn.core.io.ISVNEditor;

import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;

import util.SvnUtil.CommitAction;

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
		File wcdir = new File(wcDir);
        cloneCommand.setGitDir(dir);	//Set the repository dir
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
	

	//getHistory filePath: remote File Path under repositoryURL
    public List<LogEntry> getHistoryLogs(String filePath,long startRevision, long endRevision,int maxLogNum) 
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
	            String authorEmail=commit.getAuthorIdent().getEmailAddress();
	            String author=commit.getAuthorIdent().getName();  //作者
	
	            String commitUser=commit.getCommitterIdent().getName();
	            String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
	
	            long commitTime=commit.getCommitTime();
	
	            String fullMessage=commit.getFullMessage();
	            String shortMessage=commit.getShortMessage();  //返回message的firstLine
	
	            String commitId=commit.getName();  //这个应该就是提交的版本号
	
	            System.out.println("authorEmail:"+authorEmail);
	            System.out.println("authorName:"+author);
	            System.out.println("commitEmail:"+commitUserEmail);
	            System.out.println("commitName:"+commitUser);
	            System.out.println("time:"+commitTime);
	            System.out.println("fullMessage:"+fullMessage);
	            System.out.println("shortMessage:"+shortMessage);
	            System.out.println("commitId:"+commitId);
	            
	            LogEntry log = new LogEntry();
	            log.setCommitId(commitId);
	            log.setCommitUser(commitUser);
	            log.setCommitMsg(fullMessage);
	            log.setCommitTime(commitTime);
	            logList.add(0,log);	//add to the top
	        }
	        
	        return logList;
	    } catch (Exception e) {
			// TODO Auto-generated catch block
			System.out.println("getHistoryLogs Error");	
			e.printStackTrace();
			return null;
		}
    }
    
	public boolean getEntry(String parentPath, String entryName, String localParentPath, String targetName,String revision) {
		// TODO Auto-generated method stub
		System.out.println("svnGetEntry() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
		//check targetName and set
		if(targetName == null)
		{
			targetName = entryName;
		}
		
		String remoteEntryPath = parentPath + entryName;
		
		Repository repository = null;
        try {
            //gitDir表示git库目录
        	Git git = Git.open(new File(gitDir));
            repository = git.getRepository();
            
            //get tree at dedicated revision
            RevWalk walk = new RevWalk(repository);
            ObjectId objId = repository.resolve(revision);
            RevCommit revCommit = walk.parseCommit(objId);
            RevTree revTree = revCommit.getTree();
    		
            //Get Entry Node
            TreeWalk treeWalk = TreeWalk.forPath(repository, remoteEntryPath, revTree);
            
            boolean ret = recurGetEntry(git, repository, treeWalk, parentPath, entryName, localParentPath, targetName);
            repository.close();
            return ret;
        } catch (Exception e) {
           System.out.println("getFile() IOException"); 
           e.printStackTrace();
           return false;
        }
	}

	private boolean recurGetEntry(Git git, Repository repository, TreeWalk treeWalk, String parentPath, String entryName, String localParentPath, String targetName) {
		// TODO Auto-generated method stub
        try {
			FileMode fileMode = treeWalk.getFileMode();
	        if(FileMode.TYPE_FILE == fileMode.getObjectType())
	        {
	            FileOutputStream out = null;
	    		try {
	    			out = new FileOutputStream(localParentPath + targetName);
	    		} catch (FileNotFoundException e) {
	    			System.out.println("getFile() new FileOutputStream Failed:" + localParentPath + targetName);
	    			e.printStackTrace();
	    			return false;
	    		}
	
	            ObjectId blobId = treeWalk.getObjectId(0);
	            ObjectLoader loader = repository.open(blobId);
	            loader.copyTo(out);
	        }
	        else if(FileMode.TYPE_TREE == fileMode.getObjectType())
	        {
				File dir = new File(localParentPath,targetName);
				dir.mkdir();
				
				while(treeWalk.next())
				{
					String subEntryName = treeWalk.getNameString();
					String subParentPath = parentPath + entryName +"/";
					String subLocalParentPath = localParentPath + targetName + "/";
					if(false == recurGetEntry(git, repository, treeWalk, subParentPath, subEntryName, subLocalParentPath, subEntryName))
					{
						return false;
					}
				}				
	        }
        }catch (Exception e) {
        	//TODO
            System.out.println("recurGetEntry() Exception"); 
            e.printStackTrace();
            return false;
        }
        return true;
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
        } catch (Exception e) {
           System.out.println("getFile() IOException"); 
           e.printStackTrace();
           return false;
        } finally {
            if (repository != null)
                repository.close();
        }
        
        return true;
 	}

 	
	//Commit will commit change to Git Repos and Push to remote
	public boolean Commit(String parentPath, String entryName, String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		System.out.println("Commit");	

        Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("Commit() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return false;
		}
		
		String entryPath = parentPath+entryName;
		try {	
			if(entryPath.isEmpty())
			{
		        git.add().addFilepattern(".").call();
			}
			else
			{
				git.add().addFilepattern(parentPath+entryName).call();
			}
		} catch (Exception e) {
			System.out.println("Commit add Index Error");	
			e.printStackTrace();
			//TODO: Do roll back WorkingCopy
			rollBackIndex(git, entryPath, null);	
			return false;
		}
		
        try {
			git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
		} catch (Exception e) {
			System.out.println("Commit commit error");
			e.printStackTrace();
			//TODO: Do roll back Index
			rollBackIndex(git, entryPath, null);			
			return false;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				// TODO Auto-generated catch block
				System.out.println("Push Error");	
				e.printStackTrace();
				//TODO: Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					rollBackIndex(git, entryPath, null);
				}
				return false;
			}
		}
		
        return true;
	}
	
	private boolean rollBackCommit(Git git,String revision) {
        Repository repository = git.getRepository();  
  
        RevWalk walk = new RevWalk(repository);  
        ObjectId objId;
		try {
			if(revision != null)
			{
				objId = repository.resolve(revision);
			}
			else
			{
				objId = repository.resolve("HEAD");
			}
			RevCommit revCommit = walk.parseCommit(objId);  
	        String preVision = revCommit.getParent(0).getName();  
	        git.reset().setMode(ResetType.HARD).setRef(preVision).call();  
	        repository.close(); 
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}

	//将工作区和暂存区恢复指定版本（revision==null表示恢复到最新版本）
    private boolean rollBackIndex(Git git, String entryPath, String revision) {
		// TODO Auto-generated method stub
		//checkout操作会丢失工作区的数据，暂存区和工作区的数据会恢复到指定（revision）的版本内容
        CheckoutCommand checkoutCmd = git.checkout();
        checkoutCmd.addPath(entryPath);
        //加了“^”表示指定版本的前一个版本，如果没有上一版本，在命令行中会报错，例如：error: pathspec '4.vm' did not match any file(s) known to git.
        if(revision != null)
        {
        	checkoutCmd.setStartPoint(revision);
        }  
        
        try {
			checkoutCmd.call();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
        return true;
	}

	public boolean gitAdd(String parentPath, String entryName, String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		System.out.println("gitAdd()");	
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("gitAdd() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return false;
		}

		String entryPath = parentPath + entryName;
		try {	
			git.add().addFilepattern(entryPath).call();
		} catch (Exception e) {
			System.out.println("gitAdd() add Index Error");	
			e.printStackTrace();
			//TODO: Do roll back WorkingCopy
			delFileOrDir(entryPath);
			return false;
		}
		
        try {
			git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
		} catch (Exception e) {
			System.out.println("gitAdd() commit error");
			e.printStackTrace();
			//TODO: Do roll back Index
			if(rollBackIndex(git, entryPath, null))
			{
				delFileOrDir(entryPath);
			}
			return false;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				// TODO Auto-generated catch block
				System.out.println("gitAdd() Push Error");	
				e.printStackTrace();
				//TODO: Do roll back commit and Index 
				if(rollBackCommit(git, null))
				{
					if(rollBackIndex(git, entryPath, null))
					{
						delFileOrDir(entryPath);
					}
				}
				return false;
			}
		}
		
        return true;
	}

	public boolean gitMove(String srcParentPath, String srcEntryName, String dstParentPath, String dstEntryName,
			String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		System.out.println("gitMove()");	
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("gitMove() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return false;
		}

		String srcEntryPath = srcParentPath + srcEntryName;
		String dstEntryPath = dstParentPath + dstEntryName;

		//Add Index for delete srcEntry
		try {	
			git.add().addFilepattern(srcEntryPath).call();
		} catch (Exception e) {
			System.out.println("gitMove() add Index for srcEntry delete Failed");	
			e.printStackTrace();
			//TODO: Do roll back WorkingCopy for srcEntry
			rollBackIndex(git, srcEntryPath, null);
			return false;
		}
		
		//Add Index for add dstEntry
		try {	
			git.add().addFilepattern(dstEntryPath).call();
		} catch (Exception e) {
			System.out.println("gitMove() add Index for dstEntry add Failed");	
			e.printStackTrace();
			//TODO: Do roll back WorkingCopy for srcEntry and dstEntry
			rollBackIndex(git, srcEntryPath, null);
			delFileOrDir(dstEntryPath);
			return false;
		}
		
        try {
			git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
		} catch (Exception e) {
			System.out.println("gitAdd() commit error");
			e.printStackTrace();
			//TODO: Do roll back Index
			rollBackIndex(git, srcEntryPath, null);
			if(true == rollBackIndex(git, dstEntryPath, null))
			{
				delFileOrDir(dstEntryPath);
			}	
			return false;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				// TODO Auto-generated catch block
				System.out.println("gitAdd() Push Error");	
				e.printStackTrace();
				//TODO: Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					rollBackIndex(git, srcEntryPath, null);
					if(rollBackIndex(git, dstEntryPath, null))
					{
						delFileOrDir(dstEntryPath);
					}
				}
				return false;
			}
		}
		
		return false;
	}

	public boolean gitCopy(String srcParentPath, String srcEntryName, String dstParentPath, String dstEntryName,
			String commitMsg, String commitUser) {
		// TODO Auto-generated method stub
		System.out.println("gitCopy()");	
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("gitCopy() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return false;
		}

		String srcEntryPath = srcParentPath + srcEntryName;
		String dstEntryPath = dstParentPath + dstEntryName;
		
		//Add Index for add dstEntry
		try {	
			git.add().addFilepattern(dstEntryPath).call();
		} catch (Exception e) {
			System.out.println("gitCopy() add Index for dstEntry add Failed");	
			e.printStackTrace();
			//TODO: Do roll back WorkingCopy for srcEntry and dstEntry
			delFileOrDir(dstEntryPath);
			return false;
		}
		
        try {
			git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
		} catch (Exception e) {
			System.out.println("gitCopy() commit error");
			e.printStackTrace();
			//TODO: Do roll back Index
			if(true == rollBackIndex(git, dstEntryPath, null))
			{
				delFileOrDir(dstEntryPath);
			}	
			return false;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				// TODO Auto-generated catch block
				System.out.println("gitCopy() Push Error");	
				e.printStackTrace();
				//TODO: Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					if(rollBackIndex(git, dstEntryPath, null))
					{
						delFileOrDir(dstEntryPath);
					}
				}
				return false;
			}
		}
		
		return false;
	}

	public boolean doAutoCommit(String parentPath, String entryName, String localPath, String commitMsg, String commitUser, boolean modifyEnable, String localRefPath) {
		// TODO Auto-generated method stub
		System.out.println("doAutoCommit()" + " parentPath:" + parentPath +" entryName:" + entryName +" localPath:" + localPath + " commitMsg:" + commitMsg +" modifyEnable:" + modifyEnable + " localRefPath:" + localRefPath);	
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("gitMove() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return false;
		}
		
		File localEntry = new File(localPath);
		if(!localEntry.exists())
		{
			System.out.println("doAutoCommit() localPath " + localPath + " not exists");
			return false;
		}
	
		List <CommitAction> commitActionList = new ArrayList<CommitAction>();
		String entryPath = parentPath + entryName;
		File remoteEntry = new File(wcDir + entryPath);
		if(!remoteEntry.exists())
        {
        	System.out.println(entryPath + " 不存在");
        	System.out.println("doAutoCommit() scheduleForAddAndModify Start");
	        scheduleForAddAndModify(commitActionList,parentPath,entryName,localPath,localRefPath,modifyEnable,false);
        } 
        else if (remoteEntry.isFile()) 
        {
        	System.out.println(entryPath + " 是文件");
            return false;
        }
        else
        {
        	System.out.println("doAutoCommit() scheduleForDelete Start");
        	scheduleForDelete(commitActionList,localPath,parentPath,entryName);
	        System.out.println("doAutoCommit() scheduleForAddAndModify Start");
		    scheduleForAddAndModify(commitActionList,parentPath,entryName,localPath,localRefPath,modifyEnable,false);
        }
        
        if(commitActionList == null || commitActionList.size() ==0)
        {
        	System.out.println("doAutoCommmit() There is nothing to commit");
        	return true;
        }
        
        try {
			git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
		} catch (Exception e) {
			System.out.println("gitCopy() commit error");
			e.printStackTrace();
			//TODO: Do roll back Index
			if(true == rollBackIndex(git, entryPath, null))
			{
				rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录
			}	
			return false;
		}
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				// TODO Auto-generated catch block
				System.out.println("gitCopy() Push Error");	
				e.printStackTrace();
				//TODO: Do roll back commit and Index 
				if(rollBackCommit(git, null) == false)
				{
					if(rollBackIndex(git, entryPath, null))
					{
						rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录
					}
				}
				return false;
			}
		}
		return true;
	}

	private boolean scheduleForDelete(List<CommitAction> actionList, String localPath, String parentPath, String entryName) {
		// TODO Auto-generated method stub
		System.out.println("scheduleForDelete()" + " parentPath:" + parentPath + " entryName:" + entryName + " localPath:" + localPath);
	    if(entryName.isEmpty())	//If the entryName is empty, means we need to go through the subNodes directly
        {
        	File file = new File(wcDir + parentPath + entryName);
    		File[] tmp=file.listFiles();
    		for(int i=0;i<tmp.length;i++)
    		{
    			String subEntryName = tmp[i].getName();
   	    	    scheduleForDelete(actionList,localPath, parentPath,subEntryName);
            }
        }
        else
        {
            String remoteEntryPath = parentPath + entryName;            
            String localEntryPath = localPath + entryName;

            File localEntry = new File(localEntryPath);
            
            File remoteEntry = new File(remoteEntryPath);
            if(remoteEntry.isFile())
            {
            	if(!localEntry.exists() || localEntry.isDirectory())	//本地文件不存在或者类型不符，则删除该文件
                {
                    System.out.println("scheduleForDelete() insert " + remoteEntryPath + " to actionList for Delete");
                    if(false == remoteEntry.delete())
                    {
	                    System.out.println("scheduleForDelete() delete " + remoteEntryPath + " failed");
                    	return false;
                    }
                    insertDeleteAction(actionList,parentPath,entryName);
                }
            }
            else if(remoteEntry.isDirectory()) 
            {
            	if(!localEntry.exists() || localEntry.isFile())	//本地目录不存在或者类型不符，则删除该目录
                {
                    System.out.println("scheduleForDelete() insert " + remoteEntryPath + " to actionList for Delete");
                    if(false == remoteEntry.delete())
                    {
	                    System.out.println("scheduleForDelete() delete " + remoteEntryPath + " failed");
                    	return false;
                    }
                    insertDeleteAction(actionList,parentPath,entryName);
                }
           	    else	//If it is dir, go through the subNodes for delete
           	    {
    	        	File file = new File(wcDir + remoteEntryPath);
    	    		File[] tmp=file.listFiles();
    	    		for(int i=0;i<tmp.length;i++)
    	    		{
    	    			String subEntryName = tmp[i].getName();
           	    	    if(false == scheduleForDelete(actionList,localPath, parentPath,subEntryName))
           	    	    {
           	    	    	return false;
           	    	    }
    	            }
           	    }
            }
        }
		return true;
	}

	private boolean scheduleForAddAndModify(List<CommitAction> actionList, String parentPath, String entryName, String localPath, String localRefPath, boolean modifyEnable, boolean isSubAction) {
		// TODO Auto-generated method stub
    	System.out.println("scheduleForAddAndModify()  parentPath:" + parentPath + " entryName:" + entryName + " localPath:" + localPath + " localRefPath:" + localRefPath);

    	if(entryName.isEmpty())	//Go through the sub files for add and modify
    	{
    		File file = new File(localPath);
    		File[] tmp=file.listFiles();
    		for(int i=0;i<tmp.length;i++)
    		{
    			String subEntryName = tmp[i].getName();
    			if(false == scheduleForAddAndModify(actionList,parentPath, subEntryName, localPath, localRefPath,modifyEnable, false))
    			{
    				return false;
    			}
            }
    		return true;
    	}

    	//entryName is not empty
    	String remoteEntryPath = parentPath + entryName;
    	String localEntryPath = localPath + entryName;
    	String localRefEntryPath = localRefPath + entryName;
    	
    	File localEntry = new File(localEntryPath);
    	if(localEntry.exists())
        {
    		File remoteEntry = new File(wcDir + remoteEntryPath);	
        	if(localEntry.isDirectory())	//IF the entry is dir and need to add, we need to get the subActionList Firstly
        	{
        		String subParentPath = remoteEntryPath + "/";
	    		String subLocalPath = localEntryPath + "/";
	    		String subLocalRefPath = localRefEntryPath + "/";
	    		
    	        //If Remote path not exist
        		if (!remoteEntry.exists()) 
        		{
	            	System.out.println("scheduleForAddAndModify() insert " + remoteEntryPath + " to actionList for Add" );
	            	if(false == remoteEntry.mkdir())
	            	{
	            		System.out.println("scheduleForAddAndModify() add dir " + remoteEntryPath + " failed" );
		            	return false;
	            	}      	
	            	
	            	//Go through the sub files to Get the subActionList
		    		File[] tmp=localEntry.listFiles();
		    		List<CommitAction> subActionList = new ArrayList<CommitAction>();
		        	for(int i=0;i<tmp.length;i++)
		        	{
		        		String subEntryName = tmp[i].getName();
		        		if(false == scheduleForAddAndModify(subActionList,subParentPath, subEntryName,subLocalPath, subLocalRefPath,modifyEnable, true))
		        		{
		        			return false;
		        		}
		            }
		        	
		        	//Insert the DirAdd Action
		        	insertAddDirAction(actionList,parentPath,entryName,isSubAction,true,subActionList);
		        	return true;
	            }
        		
    			//Go through the sub Files For Add and Modify
    			File[] tmp=localEntry.listFiles();
    			for(int i=0;i<tmp.length;i++)
    			{
    				String subEntryName = tmp[i].getName();
        			if(false == scheduleForAddAndModify(actionList,subParentPath, subEntryName, subLocalPath, subLocalRefPath,modifyEnable, false))
        			{
        				return false;
        			}
        		}
	            return true;
        	}
        	else	//If the entry is file, do insert
        	{
        		if (!remoteEntry.exists()) {
	            	System.out.println("scheduleForAddAndModify() insert " + remoteEntryPath + " to actionList for Add" );
	            	if(false == copyFile(localEntryPath,wcDir + remoteEntryPath, false))
	            	{
    	            	System.out.println("scheduleForAddAndModify() copy " + localEntryPath + " to "+ remoteEntryPath + " Failed" );
	            		return false;
	            	}
	            	insertAddFileAction(actionList,parentPath, entryName,localPath,isSubAction);
	            	return true;
	            }
        		
	            if(modifyEnable)
	            {
            		//版本仓库文件已存在也暂时不处理，除非能够判断出两者不一致
            		System.out.println("scheduleForAddAndModify() insert " + remoteEntryPath + " to actionList for Modify" );
	            	if(false == copyFile(localEntryPath,wcDir + remoteEntryPath, true))
	            	{
    	            	System.out.println("scheduleForAddAndModify() copy " + localEntryPath + " to "+ remoteEntryPath + " Failed" );
	            		return false;
	            	}
            		insertModifyFile(actionList,parentPath, entryName, localPath, localRefPath);
            		return true;
            	}
	            return true;
        	}
        }
    	return true;
 	}

	private void rollBackWcDir(List<CommitAction> commitActionList) {
		// TODO Auto-generated method stub
    	for(int i=0;i<commitActionList.size();i++)
    	{
    		CommitAction action = commitActionList.get(i);
    		if(1 == action.getAction()) //add
    		{
        		delFileOrDir(wcDir + action.getEntryPath());
    		}
    	}
	}
}
