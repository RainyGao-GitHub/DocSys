package com.DocSystem.common.remoteStorage;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.eclipse.jgit.api.CheckoutCommand;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.FetchCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.PushCommand;
import org.eclipse.jgit.api.RebaseCommand;
import org.eclipse.jgit.api.RebaseResult;
import org.eclipse.jgit.api.RebaseCommand.Operation;
import org.eclipse.jgit.api.ResetCommand.ResetType;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.api.errors.WrongRepositoryStateException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffEntry.ChangeType;
import org.eclipse.jgit.internal.JGitText;
import org.eclipse.jgit.lib.AnyObjectId;
import org.eclipse.jgit.lib.Config;
import org.eclipse.jgit.lib.ConfigConstants;
import org.eclipse.jgit.lib.Constants;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.lib.RepositoryState;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.FetchResult;
import org.eclipse.jgit.transport.PushResult;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.transport.RemoteRefUpdate.Status;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;

import com.DocSystem.common.DocUtil;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.CommitAction.CommitAction;
import com.DocSystem.common.CommitAction.CommitType;
import com.DocSystem.common.entity.DocPushResult;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.LogEntry;

public class GitUtil {
	private String user = null;
    private String pwd = null;
    private String privateKey;
    
    private String localVerReposPath;
    private boolean isRemote;
    
    private String repositoryURL = null;
    private  String gitDir = null;
    private  String wcDir = null;
    private Git git = null;
    private Repository repository = null;
    private RevWalk walk = null;
    
	/**
     * 构造基于密码认证的sftp对象
	 * @param isRemote 
	 * @param localVerReposPath 
     */
    public GitUtil(String username, String password, String url, String localVerReposPath, Integer isRemote) {
        this.user = username;
        this.pwd = password;
        this.repositoryURL = url;
        this.localVerReposPath = localVerReposPath;
        this.isRemote = (isRemote == 1);     
    }

    
	public boolean login() {
		gitDir = localVerReposPath + ".git/";
		wcDir = localVerReposPath;
		if(isRemote == false)
		{
			return OpenRepos();			
		}
		
		//remote repos
		File file = new File(gitDir);
		if(file.exists() == false)
		{
			if(CloneRepos() == null)
			{
				Log.debug("GitUtil login failed: Clone Repos Failed");
				return false;
			}
		}
			
	    if(OpenRepos() == false)
	    {
	       	Log.debug("GitUtil login failed: open git repository Failed");
	    	return false;
	    }

		if(doPullEx() == false)
		{
			Log.debug("GitUtil login failed: doPullEx Failed");
			return false;
		}
		return true;
	}

	public void logout() {
		CloseRepos();
	}
	
    private boolean OpenRepos() 
    {
    	if(git != null)
    	{
    		return true;
    	}
    	
        try {
			git = Git.open(new File(gitDir));
		} catch (IOException e) {
			Log.debug("OpenRepos() Failed to open gitDir:" + gitDir);
			Log.info(e);
			return false;
		}
        
        repository = git.getRepository();
        walk = new RevWalk(repository);
        return true;
    }
    
    private void CloseRepos() 
    {
    	if(walk != null)
    	{
    		walk.close();
    		walk = null;
    	}
    	
    	if(repository != null)
    	{
    		repository.close();
    		repository = null;
    		git = null;
    		return;
    	}
    	
    	if(git != null)
    	{
    		git.close();
    		git = null;
    	}
    }
	
    //新建本地git仓库
	public String CreateRepos(){
		Log.debug("CreateRepos");
		
		File dir = new File(gitDir);
		File wcdir = new File(wcDir);
        try {
			Git.init().setGitDir(dir).setDirectory(wcdir).call();
		} catch (Exception e) {
			Log.info(e);
			Log.debug("CreateRepos error");
			return null;
		}
        
        return wcDir;
	}
	
    //Clone仓库: clone到path + name目录下
	public String CloneRepos(){
		Log.debug("CloneRepos from :" + repositoryURL);
		
		CloneCommand cloneCommand = Git.cloneRepository();
		cloneCommand.setURI(repositoryURL);
		
		if(user != null && !user.isEmpty())
		{
			Log.debug("CloneRepos user:" + user);
			cloneCommand.setCredentialsProvider( new UsernamePasswordCredentialsProvider(user, pwd));
		}
		
		File dir = new File(gitDir);
		cloneCommand.setGitDir(dir);	//Set the repository dir
		File wcdir = new File(wcDir);
        cloneCommand.setDirectory(wcdir);	//set the working copy dir
		
		try {
			cloneCommand.call();
		} catch (Exception e) {
			Log.debug("CloneRepos error");
			Log.info(e);
			return null;
		}
        
        return wcDir;
	}
	
	public Integer checkPath(String entryPath, String revision) 
	{	
        RevTree revTree = getRevTree(revision);
        if(revTree == null)
        {
        	return 0;
        }
	   
        TreeWalk treeWalk = getTreeWalkByPath(revTree, entryPath);
	    if(treeWalk == null)
	    {
	    	return 0;
	    }
	    
        if(entryPath.isEmpty())
	    {
            return 2;
	    }
	    
        int type = getEntryType(treeWalk.getFileMode());
        return type;
	}
	
	private int getEntryType(FileMode fileMode)
	{
		if(fileMode == null)
		{
			return -1;
		}
		
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
	
	public RevCommit getLatestRevCommit(Doc doc) {
    	String entryPath = doc.getPath() + doc.getName();
		try {
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
	            return commit;
	        }
	        
	        return null;
	    } catch (Exception e) {
			Log.debug("getLatestRevCommit 异常");	
			Log.info(e);
		}
		return null;
	}
	
	public long convertCommitTime(int commitTime) 
	{
		//SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String timestampString=String.valueOf(commitTime);
        Long timestamp = Long.parseLong(timestampString) * 1000;
        //String date = formatter.format(new Date(timestamp));
        return timestamp;
	}

	public TreeWalk listFiles(String entryPath, String revision)
	{    	
        try {
            
            RevTree revTree = getRevTree(revision);
            if(revTree == null)
            {
            	Log.debug("getSubEntries() Failed to get revTree for:" + entryPath + " at revision:" + revision);
            	return null;            	
            }
            
            TreeWalk treeWalk = getTreeWalkByPath(revTree, entryPath);
            if(treeWalk == null) 
            {
            	Log.debug("getSubEntries() Failed to get treeWalk for:" + entryPath + " at revision:" + revision);
            	return null;
            }
            
            if(entryPath.isEmpty())
            {
            	return treeWalk;
            }
	        
            if(treeWalk.isSubtree())
	        {
            	treeWalk.enterSubtree();
            	return treeWalk;
	        }
	        else
	        {
	        	Log.debug("getSubEntries() treeWalk for:" + entryPath + " is not directory");
	            return null;
	        }            
        } catch (Exception e) {
            Log.debug("getSubEntries() getTreeWalkByPath Exception"); 
            Log.info(e);
            return null;
         }
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
    
    public void deleteEntry(Doc doc, boolean isSubAction, List<CommitAction> commitActionList)
    {
		CommitAction action = new CommitAction();
    	action.setAction(CommitType.DELETE);
    	action.setDoc(doc);
    	commitActionList.add(action);	
    }
    
	public boolean getRemoteFile(String remoteEntryPath, String localParentPath, String targetName, String revision, boolean force) 
	{
		File localEntry = new File(localParentPath + targetName);
		if(force == false)
		{
			if(localEntry.exists())
			{
				Log.debug("getRemoteFile() " + localParentPath+targetName + " 已存在");
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
		
        RevTree revTree = getRevTree(revision);
        if(revTree == null)
        {
        	return false;
        }

		TreeWalk treeWalk = getTreeWalkByPath(revTree, remoteEntryPath);
		if(treeWalk == null)
		{
			Log.debug("getRemoteFile() treeWalk is null for:" + remoteEntryPath);
			return false;
		}
		
		//If parentDir not exist, do add it
		File parentDir = new File(localParentPath);
		if(parentDir.exists() == false)
		{
			parentDir.mkdirs();
		}
		
        FileOutputStream out = null;
		try {
			out = new FileOutputStream(localParentPath + targetName);
		} catch (Exception e) {
			Log.debug("getRemoteFile() new FileOutputStream Failed:" + localParentPath + targetName);
			Log.info(e);
			return false;
		}
		
		try {
	        ObjectId blobId = treeWalk.getObjectId(0);
	        ObjectLoader loader = repository.open(blobId);
	        Log.debug("getRemoteFile() at " + revision + " " + remoteEntryPath + " size:" + loader.getSize());	//文件大小
	        loader.copyTo(out);
	        out.close();
	        out = null;
		} catch (Exception e) {
			Log.debug("getRemoteFile() loader.copy Failed:" + localParentPath + targetName);
			Log.info(e);
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
	
	private RevTree getRevTree(String revision) {
		
		if(revision == null)
		{
			revision = "HEAD";
		}
	
        try {
        	//Get objId for revision
            ObjectId objId = repository.resolve(revision);
            if(objId == null)
            {
            	Log.debug("getRevTree() there is no any history for repository:" + gitDir + " at revision:" + revision);
            	return null;
            }
        
            RevCommit revCommit = walk.parseCommit(objId);
            if(revCommit == null)
            {
            	Log.debug("getRevTree() parseCommit Failed");
            	return null;
            }
        
            RevTree revTree = revCommit.getTree();
            return revTree;
		} catch (Exception e) {
	    	Log.debug("getRevTree() 异常");
	        Log.info(e);
		}
        return null;
	}
	

	private TreeWalk getTreeWalkByPath(RevTree revTree, String entryPath) {
		//Log.debug("getTreeWalkByPath() entryPath:" + entryPath); 

		try {
			TreeWalk treeWalk = null;
			if(entryPath.isEmpty())
	        {
	        	//Get treeWalk For whole repos
	        	treeWalk = new TreeWalk( repository );
	            treeWalk.reset(revTree);
	        }
	        else
	        {   
	        	treeWalk = TreeWalk.forPath(repository, entryPath, revTree);
	        }
			if(treeWalk != null)
			{
	            treeWalk.setRecursive(false);
			}    
			return treeWalk;
        }catch (Exception e) {
            Log.debug("getTreeWalkByPath() Exception"); 
            Log.info(e);
        }
		return null;
	}
	
	//doPullEx 保证pull一定成功
	public boolean doPullEx()
	{
		//For local Git Repos, no need to do rebase
		if(isRemote == false)
		{
			return true;
		}
		
		if(checkAndCleanBranch(git, repository, "master") == false)
		{
			Log.debug("doPullEx() Failed to checkAndCleanBranch");
    		return false;
		}
		
    	boolean ret = doPull(git, repository);
    	return ret;
	}
	
	public boolean checkAndClearnBranch()
	{
		if(checkAndCleanBranch(git, repository, "master") == false)
		{
			Log.debug("checkAndClearnBranch() Failed to checkAndCleanBranch");
			return false;
		}
    	return true;
	}
	
	
	public boolean checkAndCleanBranch(Git git, Repository repo, String branchName) 
	{
		Log.debug("checkAndCleanBranch branchName:" + branchName);
		
		//Get curBranchName and check if curBranch is correct
		String curBranchName = null;
		try {
			String fullBranch = repo.getFullBranch();
			if (fullBranch != null
					&& fullBranch.startsWith(Constants.R_HEADS)) {
				curBranchName = fullBranch.substring(Constants.R_HEADS.length());
			}
		} catch (IOException e) {
			Log.debug("checkAndCleanBranch get branchName Exception");
			Log.info(e);
			return false;
		}
		if(curBranchName == null || !curBranchName.equals(branchName))
		{
			Log.debug("checkAndCleanBranch curBranchName not matched:" + curBranchName);
			Ref ret = null;
			try {
				ret = git.checkout().setName(branchName).call();
			} catch (Exception e) {
				Log.info(e);
				return false;
			} 
			
			if(ret == null)
			{
				Log.debug("checkAndCleanBranch failed to checkout branch:" + branchName);
				return false;
			}
		}
		
		//Check and Clean Branch
		try {
			org.eclipse.jgit.api.Status status = git.status().call();
            Log.debug("Git Change: " + status.getChanged());
            Log.debug("Git Modified: " + status.getModified());
            Log.debug("Git UncommittedChanges: " + status.getUncommittedChanges());
            Log.debug("Git Untracked: " + status.getUntracked());
            if(status.isClean())
            {
				Log.debug("checkAndCleanBranch branch is clean");            	
            	return true;
            }
            
    		Log.debug("checkAndCleanBranch branch is dirty, doCleanBranch");        	
            return doCleanBranch(git, repo, status);            
		} catch (Exception e) {
			Log.debug("checkAndCleanBranch check and clean branch Exception");
			Log.info(e);
			return false;
		}
	}
	
	private boolean doCleanBranch(Git git, Repository repo, org.eclipse.jgit.api.Status status) {
		return doResetBranch(git, "HEAD");
	}

	private boolean doPull(Git git, Repository repo)
	{
		Config repoConfig = repo.getConfig();
		
		//Get branchName and remoteBranchName
		String remoteBranchName = null;
		String branchName = null;
		try {
			String fullBranch = repo.getFullBranch();
			if (fullBranch != null
					&& fullBranch.startsWith(Constants.R_HEADS)) {
				branchName = fullBranch.substring(Constants.R_HEADS.length());
			}
		} catch (IOException e) {
			Log.info(e);
			return false;
		}
		Log.debug("doPullEx branchName:" + branchName);
		
		if (remoteBranchName == null && branchName != null) {
			// get the name of the branch in the remote repository
			// stored in configuration key branch.<branch name>.merge
			remoteBranchName = repoConfig.getString(
					ConfigConstants.CONFIG_BRANCH_SECTION, branchName,
					ConfigConstants.CONFIG_KEY_MERGE);
		}
		if (remoteBranchName == null) {
			remoteBranchName = branchName;
		}
		Log.debug("doPullEx remoteBranchName:" + remoteBranchName);			
		if (remoteBranchName == null) {
			return false;
		}
		
		RepositoryState reposState = repo.getRepositoryState();
		if (!reposState.equals(RepositoryState.SAFE))
		{
			Log.debug("doPullEx repos is not safe now:" + 	reposState);
			switch(reposState)
			{
			case REBASING_MERGE:
				if(doRebaseAbort(git, repo) == false)
				{
					return false;
				}
				break;
			default:
				return false;
			}
		}
		
		String remote = null;
		if (remote == null && branchName != null) {
			// get the configured remote for the currently checked out branch
			// stored in configuration key branch.<branch name>.remote
			remote = repoConfig.getString(
					ConfigConstants.CONFIG_BRANCH_SECTION, branchName,
					ConfigConstants.CONFIG_KEY_REMOTE);
		}
		if (remote == null) {
			// fall back to default remote
			remote = Constants.DEFAULT_REMOTE_NAME;
		}
		
		FetchCommand fetch = git.fetch();
		if(user != null && !user.isEmpty())
		{
			UsernamePasswordCredentialsProvider cp = new UsernamePasswordCredentialsProvider(user, pwd);
			fetch.setCredentialsProvider(cp);
		}
		FetchResult fetchRes;
		try {
			fetchRes = fetch.call();
		} catch (Exception e) {
			Log.info(e);
			return false;
		}
		
		Log.printObject("doPullEx fetchRes:", fetchRes);
		
		Ref r = null;
		if (fetchRes != null) {
			r = fetchRes.getAdvertisedRef(remoteBranchName);
			if (r == null)
				r = fetchRes.getAdvertisedRef(Constants.R_HEADS
						+ remoteBranchName);
		}
		if (r == null) {
			Log.debug("doPullEx success: Nothing was updated on remote");
			return true;
		}

		AnyObjectId commitToMerge = r.getObjectId();
		String remoteUri = repoConfig.getString(
				ConfigConstants.CONFIG_REMOTE_SECTION, remote,
				ConfigConstants.CONFIG_KEY_URL);
		
		Log.debug("doPullEx remoteUri:" + remoteUri);
		if (remoteUri == null) {
			return false;
		}

		String upstreamName = MessageFormat.format(
				JGitText.get().upstreamBranchName,
				Repository.shortenRefName(remoteBranchName), remoteUri);
		Log.debug("doPullEx upstreamName:" + upstreamName);
		
		RebaseCommand rebase = git.rebase();
		RebaseResult rebaseRes;
		try {
			rebaseRes = rebase.setUpstream(commitToMerge).setUpstreamName(upstreamName).call();
		} catch (Exception e) {
			Log.info(e);
			return false;
		}
		
		org.eclipse.jgit.api.RebaseResult.Status status = rebaseRes.getStatus();
		Log.printObject("doPullEx rebase status:",status);
		if(status.isSuccessful())
		{
			Log.debug("doPullEx success: rebase OK");
			return true;
		}
		
		if(doFixRebaseConflict(git, repo, rebaseRes) == false)
		{
			return doRebaseAbort(git, repo);
		}
		
		return doRebaseContinue(git, repo);
	}
	
	private boolean doRebaseContinue(Git git, Repository repo) {
		RebaseCommand rebase = git.rebase();
		try {
			RebaseResult ret = rebase.setOperation(Operation.CONTINUE).call();
			return ret.getStatus().isSuccessful();
		} catch (NoHeadException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		} catch (RefNotFoundException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		} catch (WrongRepositoryStateException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		} catch (GitAPIException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		}
		return false;
	}

	private boolean doRebaseAbort(Git git, Repository repo) {
		RebaseCommand rebase = git.rebase();
		try {
			RebaseResult ret = rebase.setOperation(Operation.ABORT).call();
			return ret.getStatus().isSuccessful();
		} catch (NoHeadException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		} catch (RefNotFoundException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		} catch (WrongRepositoryStateException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		} catch (GitAPIException e) {
			// TODO Auto-generated catch block
			Log.info(e);
		}
		return false;
	}

	private boolean doFixRebaseConflict(Git git, Repository repo, RebaseResult rebaseRes) {
		//将冲突的文件更新为当前commit
		Log.printObject("doFixRebaseConflict rebase rebaseRes.getConflicts():",rebaseRes.getConflicts());
		Log.printObject("doFixRebaseConflict rebase rebaseRes.getFailingPaths:",rebaseRes.getFailingPaths());
		Log.printObject("doFixRebaseConflict rebase rebaseRes.getUncommittedChanges():",rebaseRes.getUncommittedChanges());
		
		Log.printObject("doFixRebaseConflict rebase rebaseRes.getCurrentCommit():",rebaseRes.getCurrentCommit().getName());
		String revision = rebaseRes.getCurrentCommit().getName();
		
		RevTree revTree = rebaseRes.getCurrentCommit().getTree();
        if(revTree == null)
        {
        	Log.debug("doFixRebaseConflict revTree is null for revision:" + rebaseRes.getCurrentCommit().getName());
        	return false;
        }
        
		org.eclipse.jgit.api.Status status;
		try {
			status = git.status().call();
		} catch (Exception e) {
			Log.info(e);
			return false;
		}
		
        Log.debug("Git Change: " + status.getChanged());
        Log.debug("Git Modified: " + status.getModified());
        Log.debug("Git UncommittedChanges: " + status.getUncommittedChanges());
        Log.debug("Git Untracked: " + status.getUntracked());
        if(status.isClean())
        {
			Log.debug("checkAndCleanBranch branch is clean");            	
        	return true;
        }
        //Do revert conflict files one by one
        Iterator<String> iter = status.getUncommittedChanges().iterator();
        while(iter.hasNext())
        {
        	String entryPath = iter.next();
        	Log.debug("doFixRebaseConflict entryPath:" + entryPath);
        	
        	TreeWalk treeWalk = getTreeWalkByPath(revTree, entryPath);
        	if(treeWalk == null)
        	{
        		Log.debug("doFixRebaseConflict() treeWalk is null for:" + entryPath);
        		return false;
        	}

        	String wcEntryPath = wcDir + entryPath;
        	FileOutputStream out = null;
			try {
				out = new FileOutputStream(wcEntryPath);
			} catch (Exception e) {
				Log.debug("doFixRebaseConflict() new FileOutputStream Failed:" + wcEntryPath);
				Log.info(e);
				return false;
			}
			
			try {
		        ObjectId blobId = treeWalk.getObjectId(0);
		        ObjectLoader loader = repository.open(blobId);
		        Log.debug("doFixRebaseConflict() at " + revision + " " + entryPath + " size:" + loader.getSize());	//文件大小
		        loader.copyTo(out);
		        out.close();
		        out = null;
		        //Add to Index 
				git.add().addFilepattern(entryPath).call();
			} catch (Exception e) {
				Log.debug("doFixRebaseConflict() loader.copy Failed:" + wcEntryPath);
				Log.info(e);
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
        }
        return true;
	}

	private boolean doResetBranch(Git git, String revision) {
		try {
			Ref ret = git.reset().setMode(ResetType.HARD).setRef(revision).call();
			if(ret == null)
			{
				return false;
			}
	        return true;
		} catch (Exception e) {
			Log.debug("ResetWcDir() Failed to open wcDir:" + wcDir);
			Log.info(e);
			return false;
		}			    
	}

	public String doCopy(String srcPath, String srcName, String dstPath, String dstName, String commitMsg, String commitUser, boolean isMove) {
	    Integer type = checkPath(srcPath + srcName, null);
	    if(type == null || type == 0)
	    {
	    	Log.debug("doCopy() " + srcPath + srcName  + " not exists");
	    	return null;
	    }
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			Log.debug("doCopy() Failed to open wcDir:" + wcDir);
			Log.info(e);
			return null;
		}
		
		if(isMove)
		{
			if(moveEntry(git, srcPath, srcName, dstPath, dstName) == false)
		    {
		    	Log.debug("doCopy() moveEntry Failed");
		    	git.close();
		        return null;
		    }			
		}
		else
		{
			if(copyEntry(git, srcPath, srcName, dstPath, dstName) == false)
		    {
		    	Log.debug("doCopy() copyEntry Failed");
		    	git.close();
		        return null;
		    }
		}
	    
	    String newRevision =  doCommit(git, commitUser, commitMsg, null);
	    
	    if(newRevision == null)
	    {
	    	//Do rollBack
			//Do roll back Index
			rollBackIndex(git, "", null);
			
			//rollBackWcDir(realCommitActionList);	//删除actionList中新增的文件和目录	
			FileUtil.delFileOrDir(wcDir + dstPath + dstName);
			
			git.close();
			return null;
	    }
	    
	    git.close();
	    
	    doPushEx();
	    return newRevision;
	}
	

	public String doCommit(String commitMsg, String commitUser, DocPushResult pushResult, List<CommitAction> commitActionList) {
	    if(commitActionList == null || commitActionList.size() ==0)
	    {
	    	Log.debug("doCommit() There is nothing to commit");
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
		
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			Log.debug("doAutoCommit() Failed to open wcDir:" + wcDir);
			Log.info(e);
			return null;
		}
		
		if(executeCommitActionList(git,realCommitActionList,true) == false)
	    {
	    	Log.debug("doAutoCommit() executeCommitActionList Failed");
	    	git.close();
	        return null;
	    }
	    
	    String newRevision =  doCommit(git, commitUser, commitMsg, realCommitActionList);
	    
	    if(newRevision == null)
	    {
	    	//Do rollBack
			//Do roll back Index
			rollBackIndex(git, "", null);
			rollBackWcDir(realCommitActionList);	//删除actionList中新增的文件和目录	
			git.close();
			return null;
	    }
	    
	    git.close();
	    
	    doPushEx();
	    return newRevision;
	}
	
	private List<CommitAction> getRealCommitActionList(Doc doc, String commitMsg, String commitUser,
			DocPushResult pushResult, List<CommitAction> commitActionList) {
    	String parentPath = doc.getPath();
        Log.debug("getRealCommitActionList() parentPath:" + parentPath);

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
    		Log.debug("getRealCommitActionList() Exception");
    		Log.info(e);
    	}
    	
    	return realCommitActionList;
	}


	public boolean doPushEx()
	{
		//For local Git Repos, no need to do fetch
		if(isRemote == false)
		{
			return true;
		}
    	
    	boolean ret = doPush(git, repository);
    	
    	return ret;
	}

	private boolean doPush(Git git, Repository repo)
	{
		try {
			
			PushCommand pushCmd = git.push();
			if(user != null && !user.isEmpty())
			{
				UsernamePasswordCredentialsProvider cp = new UsernamePasswordCredentialsProvider(user, pwd);
				pushCmd.setCredentialsProvider(cp);
			}
			
	        Iterable<PushResult> pushResults = pushCmd.call();
		    PushResult pushResult = pushResults.iterator().next();
	        Status status = pushResult.getRemoteUpdate( "refs/heads/master" ).getStatus();

	        Log.printObject("doPush() PushResult:", status);
	       
	        if(status.name().equals("OK") || status.name().equals("UP_TO_DATE"))
	        {
	        	Log.debug("doPush() Push OK");	    	
		        return true;		        	
	        }

			Log.debug("doPush() Push Failed");
			return false;
		} catch (Exception e) {
			Log.debug("doPush() Push Exception");	
			Log.info(e);
			return false;
		}
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
			Log.debug("rollBackIndex() Exception");
			Log.info(e);
			return false;
		}
        return true;
	}
    
	private void rollBackWcDir(List<CommitAction> commitActionList) {
    	for(int i=0;i<commitActionList.size();i++)
    	{
    		CommitAction action = commitActionList.get(i);
    		Doc doc = action.getDoc();
    		if(CommitType.ADD == action.getAction()) //add
    		{
        		FileUtil.delFileOrDir(wcDir + doc.getPath() + doc.getName());
    		}
    	}
	}
	
	
	private String doCommit(Git git, String commitUser, String commitMsg, List<CommitAction> commitActionList) 
	{		
        RevCommit ret = null;
        try {
			ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			Log.debug("doAutoCommmit() commitId:" + ret.getName());
		} catch (Exception e) {
			Log.debug("doAutoCommmit() commit error");
			Log.info(e);
			return null;
		}
		return ret.getName();
	}

	private boolean executeCommitActionList(Git git, List<CommitAction> commitActionList,boolean openRoot) {
    	Log.debug("executeCommitActionList() szie: " + commitActionList.size());
		try {
	    	for(int i=0;i<commitActionList.size();i++)
	    	{
	    		CommitAction action = commitActionList.get(i);
	    		switch(action.getAction())
	    		{
	    		case ADD:	//add
	        		executeAddAction(git,action);
	    			break;
	    		case DELETE: //delete
	    			executeDeleteAction(git,action);
	    			break;
	    		case MODIFY: //modify
	    			executeModifyAction(git,action);
	        		break;
				default:
					break;
	    		}
	    	}	    	
	    	return true;
		} catch (Exception e) {
			Log.debug("executeCommitActionList() 异常");	
			Log.info(e);
			return false;
		}
	}
	
	private boolean executeModifyAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();
		
		//Log.printObject("executeModifyAction:", doc);
		Log.debug("executeModifyAction() " + doc.getPath() + doc.getName());
		
		if(!modifyFile(git, doc))
		{
			action.setResult(false);
			return false;
		}
		return true;
	}

	private boolean executeDeleteAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();

		//Log.printObject("executeDeleteAction:", doc);
		Log.debug("executeDeleteAction() " + doc.getPath() + doc.getName());
		if(!deleteEntry(git, doc))
		{
			action.setResult(false);
			return false;
		}
		return true;
	}
	
	private boolean executeAddAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();
	
		//Log.printObject("executeAddAction:", doc);
		Log.debug("executeAddAction() " + doc.getPath() + doc.getName());
		
		//entry is file
		if(doc.getType() == 1)
		{		
			if(!addEntry(git, doc))
			{
				action.setResult(false);
				return false;
			}
			return true;
		}
		
    	if(action.getSubActionList() == null)	
    	{
			if(!addEntry(git, doc))
			{
				action.setResult(false);
				return false;
			}
			return true;
    	}
    	
    	if(!addEntry(git, doc))
    	{
			action.setResult(false);
			return false;
    	}
    			
    	if(executeCommitActionList(git, action.getSubActionList(),false) == false)
    	{
    		return false;
    	}
    	return true;
  	}

    //doModifyFile
    private boolean modifyFile(Git git, Doc doc)
    {
    	//Add to Doc to WorkingDirectory
    	String entryPath = doc.getPath() + doc.getName();
		String remoteEntryPath = doc.offsetPath + entryPath;
    	
    	String docPath = doc.getLocalRootPath() + entryPath;
		String wcDocPath = wcDir + remoteEntryPath;
    	
    	if(FileUtil.copyFile(docPath, wcDocPath, true) == false)
		{
			Log.debug("modifyFile() copy File to WD error");					
			return false;
		}
    	
    	try {	
			git.add().addFilepattern(remoteEntryPath).call();
		} catch (Exception e) {
			Log.debug("addEntry() add Index Error");	
			Log.info(e);
			return false;
		}
		return true;
    }
    
	private boolean deleteEntry(Git git, Doc doc) 
	{
		String entryPath = doc.getPath() + doc.getName();
		String remoteEntryPath = doc.offsetPath + entryPath;
		String wcDocPath = wcDir + remoteEntryPath;
		
		if(FileUtil.delFileOrDir(wcDocPath) == false)
		{
			Log.debug("deleteEntry() delete WD Error");	
			return false;
		}
		
		try {	
			git.rm().addFilepattern(remoteEntryPath).call();
		} catch (Exception e) {
			Log.debug("addEntry() add Index Error");	
			Log.info(e);
			return false;
		}
		return true;
	}

	public boolean addEntry(Git git, Doc doc) 
	{
		String entryPath = doc.getPath() + doc.getName();
		String remoteEntryPath = doc.offsetPath + entryPath;
		
		//local Doc Path
		String docPath = doc.getLocalRootPath() + entryPath;
	
		//remote Doc Path
		String wcDocPath = wcDir + remoteEntryPath;

		if(doc.getType() == 1)
		{
			if(FileUtil.copyFile(docPath, wcDocPath, true) == false)
			{
				Log.debug("addEntry() FileUtil.copyFile from " + docPath + " to " + wcDocPath + " 失败");		
				return false;
			}
		}
		else
		{
			//Add Dir
			File dir = new File(wcDocPath);
			if(dir.exists() == false)
			{
				if(dir.mkdir() == false)
				{
					Log.debug("addEntry() mkdir for " + wcDocPath + " 失败");					
					return false;
				}
			}
		}
		
		try {	
			git.add().addFilepattern(remoteEntryPath).call();
		} catch (Exception e) {
			Log.debug("addEntry() git.add.addFilepattern.call for " + remoteEntryPath + " 失败");	
			Log.info(e);
			return false;
		}
		return true;
	}
	
	public boolean moveEntry(Git git, String srcPath, String srcName, String dstPath, String dstName) 
	{
		String srcRemoteEntryPath = srcPath + srcName; 
		String dstRemoteEntryPath = dstPath + dstName; 
		String srcWcDocPath = wcDir + srcRemoteEntryPath;
		String dstWcDocPath = wcDir + dstRemoteEntryPath;
		
		if(FileUtil.moveFileOrDir(wcDir + srcPath, srcName,  wcDir + dstPath, dstName, false) == false)
		{
			Log.debug("copyEntry() FileUtil.moveFileOrDir from " + srcWcDocPath + " to " + dstWcDocPath + " 失败");		
			return false;
		}			
		
		//先增加目标文件
		try {	
			git.add().addFilepattern(dstRemoteEntryPath).call();
		} catch (Exception e) {
			Log.debug("addEntry() git.add.addFilepattern.call for " + dstRemoteEntryPath + " 失败");	
			Log.info(e);
			return false;
		}

		//删除源文件
		try {	
			git.rm().addFilepattern(srcRemoteEntryPath).call();
		} catch (Exception e) {
			Log.debug("addEntry() git.add.addFilepattern.call for " + srcRemoteEntryPath + " 失败");	
			Log.info(e);
			//return false;
		}

		return true;
	}
	
	public boolean copyEntry(Git git, String srcPath, String srcName, String dstPath, String dstName) 
	{
		String srcRemoteEntryPath = srcPath + srcName; 
		String dstRemoteEntryPath = dstPath + dstName; 
		String srcWcDocPath = wcDir + srcRemoteEntryPath;
		String dstWcDocPath = wcDir + dstRemoteEntryPath;
	
		if(FileUtil.copyFileOrDir(srcWcDocPath, dstWcDocPath, false) == false)
		{
			Log.debug("copyEntry() FileUtil.copyFileOrDir from " + srcWcDocPath + " to " + dstWcDocPath + " 失败");		
			return false;
		}
		
		try {	
			git.add().addFilepattern(dstRemoteEntryPath).call();
		} catch (Exception e) {
			Log.debug("addEntry() git.add.addFilepattern.call for " + dstRemoteEntryPath + " 失败");	
			Log.info(e);
			return false;
		}
		return true;
	}


	//getHistory entryPath: remote File Path under repositoryURL
    public List<LogEntry> getHistoryLogs(String entryPath,String startRevision, String endRevision,int maxLogNum) 
    {
    	Log.debug("getHistoryLogs entryPath:" + entryPath);	    	
    	try {
	    	List<LogEntry> logList = new ArrayList<LogEntry>();
				
		    Iterable<RevCommit> iterable = null;
		    if(entryPath == null || entryPath.isEmpty())
		    {
		    	iterable = git.log().setMaxCount(maxLogNum).call();
		    }
		    else
		    {
		    	iterable = git.log().addPath(entryPath).setMaxCount(maxLogNum).call();
		    }
		    
		    Iterator<RevCommit> iter=iterable.iterator();
	        while (iter.hasNext()){
	            RevCommit commit=iter.next();
	            //String authorEmail=commit.getAuthorIdent().getEmailAddress();
	            //String author=commit.getAuthorIdent().getName();  //作者
	
	            String commitUser=commit.getCommitterIdent().getName();
	            //String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
	
	            long commitTime = convertCommitTime(commit.getCommitTime());
	
	            String fullMessage=commit.getFullMessage();
	            //String shortMessage=commit.getShortMessage();  //返回message的firstLine
	
	            String commitId=commit.getName();  //这个应该就是提交的版本号
	
////	            Log.debug("authorEmail:"+authorEmail);
////	            Log.debug("authorName:"+author);
////	            Log.debug("commitEmail:"+commitUserEmail);
//	            Log.debug("commitName:"+commitUser);
//	            Log.debug("time:"+commitTime);
//	            Log.debug("fullMessage:"+fullMessage);
////	            Log.debug("shortMessage:"+shortMessage);
//	            Log.debug("commitId:"+commitId);
	            
	            LogEntry log = new LogEntry();
	            log.setCommitId(commitId);
	            log.setCommitUser(commitUser);
	            log.setCommitMsg(fullMessage);
	            log.setCommitTime(commitTime);
	            logList.add(log);
	        }
	        
	        return logList;
	    } catch (Exception e) {
			Log.debug("getHistoryLogs Error");	
			Log.info(e);
			return null;
		}
    }
    
    //getHistory wcDir
    public List<LogEntry> getWCHistoryLogs(String entryPath,String startRevision, String endRevision,int maxLogNum) 
    {
    	Log.debug("getWCHistoryLogs entryPath:" + entryPath);	

    	Git git = null;
        try {
			git = Git.open(new File(wcDir));
		} catch (IOException e) {
			Log.debug("getWCHistoryLogs() Failed to open gitDir:" + gitDir);
			Log.info(e);
			return null;
		}
        
    	
    	try {
	    	List<LogEntry> logList = new ArrayList<LogEntry>();
				
		    Iterable<RevCommit> iterable = null;
		    if(entryPath == null || entryPath.isEmpty())
		    {
		    	iterable = git.log().setMaxCount(maxLogNum).call();
		    }
		    else
		    {
		    	iterable = git.log().addPath(entryPath).setMaxCount(maxLogNum).call();
		    }
		    
		    Iterator<RevCommit> iter=iterable.iterator();
	        while (iter.hasNext()){
	            RevCommit commit=iter.next();
	            //String authorEmail=commit.getAuthorIdent().getEmailAddress();
	            //String author=commit.getAuthorIdent().getName();  //作者
	
	            String commitUser=commit.getCommitterIdent().getName();
	            //String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
	
	            long commitTime = convertCommitTime(commit.getCommitTime());
	
	            String fullMessage=commit.getFullMessage();
	            //String shortMessage=commit.getShortMessage();  //返回message的firstLine
	
	            String commitId=commit.getName();  //这个应该就是提交的版本号
	
	            Log.debug("commitName:"+commitUser);
	            Log.debug("time:"+commitTime);
	            Log.debug("fullMessage:"+fullMessage);
	            Log.debug("commitId:"+commitId);
	            
	            LogEntry log = new LogEntry();
	            log.setCommitId(commitId);
	            log.setCommitUser(commitUser);
	            log.setCommitMsg(fullMessage);
	            log.setCommitTime(commitTime);
	            logList.add(log);
	        }
	        
	        return logList;
	    } catch (Exception e) {
			Log.debug("getHistoryLogs Error");	
			Log.info(e);
			return null;
		}
    }

    public List<ChangedItem> getHistoryDetail(String entryPath, String commitId) {
		String revision = "HEAD";
		if(commitId != null)
		{
			revision = commitId;
		}
    	
    	List<ChangedItem> changedItemList = getHistoryDetailBasic(entryPath, revision);    	
        return changedItemList;
    }
    
	private List<ChangedItem> getHistoryDetailBasic(String entryPath, String revision) {
    	//Log.debug("getHistoryDetail entryPath:" + entryPath);	
		
		List<ChangedItem> changedItemList = new ArrayList<ChangedItem>();
		
		try {
	        //Get objId for revision
	        ObjectId objId = repository.resolve(revision);
	        if(objId == null)
	        {
	        	Log.debug("getHistoryDetail() There is no any commit history for repository:"  + gitDir + " at revision:"+ revision);
	        	return changedItemList;
	        }
	        
	        RevCommit revCommit = walk.parseCommit(objId);
	        RevCommit previsouCommit=getPrevHash(revCommit,repository);

	        if(previsouCommit == null)	//It is first commit, so all Items was new added
	        {
    			Log.debug("getHistoryDetail() previsouCommit is null, so It is first Commit"); 

	        	//go through all Items under revTree
	        	RevTree revTree = revCommit.getTree();
	            TreeWalk treeWalk = getTreeWalkByPath(revTree, "");
	            treeWalk.setRecursive(true);
	    		try {
	    			while(treeWalk.next())
	    	    	{
	    	    		int type = getEntryType(treeWalk.getFileMode(0));
	    		    	if(type <= 0)
	    		    	{
	    		    		continue;
	    		    	}
	    		    	
	    	    		String nodePath =  treeWalk.getPathString();;
	    	    		//Log.debug("getHistoryDetail() entry nodePath:" + nodePath); 
	    	    		//Add to changedItemList
	    	    		
	    	    		ChangedItem changedItem = new ChangedItem();
	    	    		changedItem.setChangeType(1);	//Add
	    	    		changedItem.setEntryType(type);
	    	    		changedItem.setEntryPath(nodePath);
	    	    		changedItem.setSrcEntryPath(null);
	    	    		changedItem.setCommitId(revision);
	    	    		changedItemList.add(changedItem);				
	    	    	}
	    		} catch(Exception e){
	    			Log.debug("getHistoryDetail() treeWalk.next() Exception"); 
	                Log.info(e);
	    			return null;
	    		}
				return changedItemList;	        	
	        }
	        
	        ObjectId head=revCommit.getTree().getId();
	        ObjectId preHead = previsouCommit.getTree().getId();
	
			ObjectReader reader = repository.newObjectReader();
			CanonicalTreeParser oldTreeIter = new CanonicalTreeParser();
			oldTreeIter.reset(reader, preHead);
	  		CanonicalTreeParser newTreeIter = new CanonicalTreeParser();
			newTreeIter.reset(reader, head);
			
			List<DiffEntry> diffs= git.diff()
	                		.setNewTree(newTreeIter)
	                		.setOldTree(oldTreeIter)
	                		.call();

			if(diffs.size() > 0)
			{
		        for (DiffEntry entry : diffs) 
		        {
		          //Log.debug("getHistoryDetail() Entry: " + entry);
		          
		      	  String nodePath = entry.getNewPath();
		          Integer entryType = getEntryType(entry.getNewMode());
		          Integer changeType = getChangeType(entry.getChangeType());
		          String srcEntryPath = entry.getOldPath();
		          if(changeType == 2)	//Delete
		          {
		        	  nodePath = srcEntryPath;	//删除操作，newPath不存在了，所以此时nodePath应该用删除前的Path
		          }
				          
		          //Add to changedItemList
		          ChangedItem changedItem = new ChangedItem();
		          changedItem.setChangeType(changeType);	
		          changedItem.setEntryType(entryType);
		          changedItem.setEntryPath(nodePath);
		          
		          changedItem.setSrcEntryPath(srcEntryPath);
		          
		          changedItem.setCommitId(revision);
		          
		          changedItemList.add(changedItem);
		        }
			}
	        return changedItemList;
		} catch (Exception e) {
			Log.debug("getHistoryDetail() entryPath:" + entryPath + " 异常");	
			Log.info(e);
			return null;
		}	
	}
	
    private Integer getChangeType(ChangeType changeType) {

    	switch(changeType)
    	{
    	case ADD:
    		return 1;
    	case DELETE:
    		return 2;
    	case MODIFY:
    		return 3;
    	case COPY:
    		return 4;
    	case RENAME:
    		return 5;
    	}
    	
    	return null;
	}
    
	public static RevCommit getPrevHash(RevCommit commit, Repository repo)  throws  IOException {
		 
	    try (RevWalk walk = new RevWalk(repo)) {
	        // Starting point
	        walk.markStart(commit);
	        int count = 0;
	        for (RevCommit rev : walk) {
	            // got the previous commit.
	            if (count == 1) {
	                return rev;
	            }
	            count++;
	        }
	        walk.dispose();
	    }
	    //Reached end and no previous commits.
	    return null;
	}
}
