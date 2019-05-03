package util.GitUtil;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.util.ArrayList;
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
import com.DocSystem.common.CommitAction;
import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;

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
	
	//getHistoryDetail filePath: remote File Path under repositoryURL
    public LogEntry getHistoryDetail(String filePath, String revision) 
    {
    	return null;
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
	public List<Doc> getDocList(Repos repos, Integer pid, String parentPath, int level, String revision)
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
            	return null;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);
            System.out.println("revCommit name:" + revCommit.getName());
            System.out.println("revCommit type:" + revCommit.getType());
            System.out.println("revCommit commitMsg:" + revCommit.getShortMessage());
    		
            RevTree revTree = revCommit.getTree();
            System.out.println("revTree name:" + revTree.getName());
            System.out.println("revTree id:" + revTree.getId());
            
            TreeWalk treeWalk = getTreeWalkByPath(repository, revTree, parentPath);
            List <Doc> subEntryList =  null;
            if(treeWalk != null) 
            {
            	subEntryList =  new ArrayList<Doc>();
            	while(treeWalk.next())
            	{
            		int type = getTypeFromFileMode(treeWalk.getFileMode(0));
            		if(type > 0)
            		{
            			String name = treeWalk.getNameString();
            			ObjectId objectId = treeWalk.getObjectId(0);
            			
                		Doc subEntry = new Doc();
                		subEntry.setVid(repos.getId());
                		subEntry.setPid(pid);
                		subEntry.setPath(parentPath);
                		
                		subEntry.setId(buildDocIdByName(level,name));
                		subEntry.setName(treeWalk.getNameString());
                   		subEntry.setType(type);
                		//subEntry.setSize();
                		//subEntry.setCreateTime();
                		//subEntry.setLatestEditTime();
                		subEntry.setState(0);   		
                   		//subEntry.setRevision("");
                		subEntryList.add(subEntry);
            		}
            	}
            }
            repository.close();
            
            return subEntryList;
        } catch (Exception e) {
           System.out.println("ReposTreeWalk() Exception"); 
           e.printStackTrace();
           return null;
        }
	}
    
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public List<GitEntry> getSubEntryList(String parentPath, String revision)
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
            	return null;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);
            System.out.println("revCommit name:" + revCommit.getName());
            System.out.println("revCommit type:" + revCommit.getType());
            System.out.println("revCommit commitMsg:" + revCommit.getShortMessage());
    		
            RevTree revTree = revCommit.getTree();
            System.out.println("revTree name:" + revTree.getName());
            System.out.println("revTree id:" + revTree.getId());
            
            TreeWalk treeWalk = getTreeWalkByPath(repository, revTree, parentPath);
            List <GitEntry> subEntryList =  null;
            if(treeWalk != null) 
            {
            	subEntryList =  new ArrayList<GitEntry>();
            	while(treeWalk.next())
            	{
            		int type = getTypeFromFileMode(treeWalk.getFileMode(0));
            		if(type > 0)
            		{
                		GitEntry subEntry = new GitEntry();
                		subEntry.setType(type);
                		subEntry.setPath(treeWalk.getPathString());
                		subEntry.setName(treeWalk.getNameString());
                		subEntryList.add(subEntry);
            		}
            	}
            }
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

	public boolean getEntry(String parentPath, String entryName, String localParentPath, String targetName,String revision) {
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
		
		String remoteEntryPath = parentPath + entryName;
		
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
            boolean ret = recurGetEntry(git, repository, treeWalk, parentPath, entryName, localParentPath, targetName);
            repository.close();
            return ret;
        } catch (Exception e) {
           System.out.println("getEntry() Exception"); 
           e.printStackTrace();
           return false;
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
	
	private boolean recurGetEntry(Git git, Repository repository, TreeWalk treeWalk, String parentPath, String entryName, String localParentPath, String targetName) {
		System.out.println("recurGetEntry() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
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
	    			return false;
	    		}
	
	            ObjectId blobId = treeWalk.getObjectId(0);
	            ObjectLoader loader = repository.open(blobId);
	            loader.copyTo(out);
	            out.close();
	            return true;
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
					if(false == recurGetEntry(git, repository, treeWalk, subParentPath, subEntryName, subLocalParentPath, subEntryName))
					{
						return false;
					}
				}
				return true;
	        }
	        else 
	        {
	        	System.out.println("recurGetEntry() unknown FileMode:" + fileMode.getBits());
	        	return false;
	        }
        }catch (Exception e) {
            System.out.println("recurGetEntry() Exception"); 
            e.printStackTrace();
            return false;
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
		System.out.println("Commit() " + parentPath + entryName);	

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
			System.out.println("Commit() Commit add Index Error");	
			e.printStackTrace();
			//Do roll back WorkingCopy
			rollBackIndex(git, entryPath, null);	
			return false;
		}
		
        try {
			RevCommit ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("Commit() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("Commit() commit error");
			e.printStackTrace();
			//Do roll back Index
			rollBackIndex(git, entryPath, null);			
			return false;
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
				return false;
			}
		}
		
        return true;
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

	public boolean gitAdd(String parentPath, String entryName, String commitMsg, String commitUser) {
		System.out.println("gitAdd() " + parentPath + entryName);	
		
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
			//Do roll back WorkingCopy
			delFileOrDir(entryPath);
			return false;
		}
		
        try {
        	CommitCommand commitCmd = git.commit();
			commitCmd.setCommitter(commitUser, "").setMessage(commitMsg);
			
			RevCommit ret = commitCmd.call();
			System.out.println("gitAdd() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("gitAdd() commit error");
			e.printStackTrace();
			//Do roll back Index
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
				System.out.println("gitAdd() Push Error");	
				e.printStackTrace();
				//Do roll back commit and Index 
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
		System.out.println("gitMove() move " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName);	
		
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
			//Do roll back WorkingCopy for srcEntry
			rollBackIndex(git, srcEntryPath, null);
			return false;
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
			return false;
		}
		
        try {
			RevCommit ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
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
			return false;
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
				return false;
			}
		}
		
		return true;
	}

	public boolean gitCopy(String srcParentPath, String srcEntryName, String dstParentPath, String dstEntryName,
			String commitMsg, String commitUser) {
		System.out.println("gitCopy() copy " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName);	
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("gitCopy() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return false;
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
			return false;
		}
		
        try {
			RevCommit ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("gitCopy() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("gitCopy() commit error");
			e.printStackTrace();
			//Do roll back Index
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
				return false;
			}
		}
		
		return true;
	}

	public boolean doAutoCommit(String parentPath, String entryName, String localPath, String commitMsg, String commitUser, boolean modifyEnable, String localRefPath) {
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
			RevCommit ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("doAutoCommmit() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("doAutoCommmit() commit error");
			e.printStackTrace();
			//Do roll back Index
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
				System.out.println("gitCopy() Push Error");	
				e.printStackTrace();
				//Do roll back commit and Index 
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
    	for(int i=0;i<commitActionList.size();i++)
    	{
    		CommitAction action = commitActionList.get(i);
    		if(1 == action.getAction()) //add
    		{
        		delFileOrDir(wcDir + action.getParentPath() + action.getEntryName());
    		}
    	}
	}
}
