package util.GitUtil;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.MessageFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
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
import org.eclipse.jgit.errors.NoWorkTreeException;
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
import org.eclipse.jgit.lib.RefUpdate.Result;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.lib.RepositoryState;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.FetchResult;
import org.eclipse.jgit.transport.PushResult;
import org.eclipse.jgit.transport.RemoteRefUpdate.Status;
import org.eclipse.jgit.transport.TrackingRefUpdate;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;

import com.DocSystem.common.CommitAction;
import com.DocSystem.common.CommitAction.CommitType;
import com.DocSystem.common.DocChange;
import com.DocSystem.common.DocChange.DocChangeType;
import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.ChangedItem;
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
	
	//以下三个变量只用于打开gitDir而不是wcDir
    Git git = null;
    Repository repository = null;
    RevWalk walk = null;
    
	public boolean Init(Repos repos,boolean isRealDoc, String commitUser) {
    	String localVerReposPath = getLocalVerReposPath(repos,isRealDoc);
    	//System.out.println("GITUtil Init() localVerReposPath:" + localVerReposPath); 
		
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
	
	//注意OpenRepos不能用于Commit，Commit目前的实现是基于WorkingCopy实现的，因此需要打开wcDir进行Commit
    private boolean OpenRepos() 
    {
    	if(git != null)
    	{
    		return true;
    	}
    	
        try {
			git = Git.open(new File(gitDir));
		} catch (IOException e) {
			System.out.println("OpenRepos() Failed to open gitDir:" + gitDir);
			e.printStackTrace();
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
		System.out.println("CloneRepos from :" + repositoryURL);
		
		CloneCommand cloneCommand = Git.cloneRepository();
		cloneCommand.setURI(repositoryURL);
		
		if(user != null && !user.isEmpty())
		{
			System.out.println("CloneRepos user:" + user);
			cloneCommand.setCredentialsProvider( new UsernamePasswordCredentialsProvider(user, pwd));
		}
		
		File dir = new File(gitDir);
		cloneCommand.setGitDir(dir);	//Set the repository dir
		File wcdir = new File(wcDir);
        cloneCommand.setDirectory(wcdir);	//set the working copy dir
		
		try {
			cloneCommand.call();
		} catch (Exception e) {
			System.out.println("CloneRepos error");
			e.printStackTrace();
			return null;
		}
        
        return wcDir;
	}
	
	public String getLatestReposRevision() 
	{
    	String revision = "HEAD";
        
    	if(OpenRepos() == false)
    	{
        	System.out.println("getLatestRevision() Failed to open git repository");
    		return null;
    	}

		try {
			
            //Get objId for revision
            ObjectId objId = repository.resolve(revision);
            if(objId == null)
            {
            	System.out.println("getLatestRevision() There is no any commit history for:" + revision);
            	CloseRepos();
            	return null;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);
            if(revCommit == null)
            {
            	System.out.println("getLatestRevision() parseCommit Failed:" + revision);
            	CloseRepos();
            	return null;            	
            }
            
            revision = revCommit.getName();
            CloseRepos();
            return revision;
            
		} catch (IOException e) {
			System.out.println("getLatestRevision() Exception");        	
			e.printStackTrace();
			CloseRepos();
			return null;
		}
	}
    
	private RevCommit getLatestRevCommit(Doc doc) {
    	if(OpenRepos() == false)
    	{
        	System.out.println("getLatestRevCommit() Failed to open git repository");
    		return null;
    	}
    	
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
	            CloseRepos();
	            return commit;
	        }
	        
	        CloseRepos();
	        return null;
	    } catch (Exception e) {
			System.out.println("getLatestRevCommit 异常");	
			e.printStackTrace();
			CloseRepos();
		}
		return null;
	}
        
    public String getLatestRevision(Doc doc) 
    {
    	RevCommit commit = getLatestRevCommit(doc);	
    	if(commit == null)
    	{
    		return null;
    	}
    	
        String revision = commit.getName();  //revision
		return revision;
	}
	
	//这个接口是用来获取
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
	    	Doc remoteEntry = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), doc.getLevel(), type, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
	    	remoteEntry.setRevision(revision);
	    	return remoteEntry;
		}

        if(revision != null) 
		{
        	//If revision already set, no need to get revision
	    	Doc remoteEntry = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), doc.getLevel(), type, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
	    	remoteEntry.setRevision(revision);
	    	return remoteEntry;
		}

        RevCommit commit = getLatestRevCommit(doc);
        if(commit == null)
        {
        	System.out.println("getLatestRevision() Failed to getLatestRevCommit");
        	return null;
        }
		
        String commitId=commit.getName();  //revision
	    String author=commit.getAuthorIdent().getName();  //作者
	    String commitUser=commit.getCommitterIdent().getName();
	    long commitTime = convertCommitTime(commit.getCommitTime());
	            
	    //String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
        Doc remoteDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), doc.getLevel(), type, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
		remoteDoc.setRevision(commitId);
        remoteDoc.setCreatorName(author);
        remoteDoc.setLatestEditorName(commitUser);
        remoteDoc.setLatestEditTime(commitTime);
        return remoteDoc;
    }

	static long convertCommitTime(int commitTime) 
	{
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String timestampString=String.valueOf(commitTime);
        Long timestamp = Long.parseLong(timestampString) * 1000;
        String date = formatter.format(new Date(timestamp));
        return timestamp;
	}
	
	//getHistory entryPath: remote File Path under repositoryURL
    public List<LogEntry> getHistoryLogs(String entryPath,String startRevision, String endRevision,int maxLogNum) 
    {
    	System.out.println("getHistoryLogs entryPath:" + entryPath);	

    	if(OpenRepos() == false)
    	{
        	System.out.println("getLatestRevCommit() Failed to open git repository");
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
	
////	            System.out.println("authorEmail:"+authorEmail);
////	            System.out.println("authorName:"+author);
////	            System.out.println("commitEmail:"+commitUserEmail);
//	            System.out.println("commitName:"+commitUser);
//	            System.out.println("time:"+commitTime);
//	            System.out.println("fullMessage:"+fullMessage);
////	            System.out.println("shortMessage:"+shortMessage);
//	            System.out.println("commitId:"+commitId);
	            
	            LogEntry log = new LogEntry();
	            log.setCommitId(commitId);
	            log.setCommitUser(commitUser);
	            log.setCommitMsg(fullMessage);
	            log.setCommitTime(commitTime);
	            logList.add(log);
	        }
	        
	        CloseRepos();
	        return logList;
	    } catch (Exception e) {
			System.out.println("getHistoryLogs Error");	
			e.printStackTrace();
			CloseRepos();
			return null;
		}
    }
    
    //getHistory wcDir
    public List<LogEntry> getWCHistoryLogs(String entryPath,String startRevision, String endRevision,int maxLogNum) 
    {
    	System.out.println("getWCHistoryLogs entryPath:" + entryPath);	

    	Git git = null;
        try {
			git = Git.open(new File(wcDir));
		} catch (IOException e) {
			System.out.println("getWCHistoryLogs() Failed to open gitDir:" + gitDir);
			e.printStackTrace();
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
	
	            System.out.println("commitName:"+commitUser);
	            System.out.println("time:"+commitTime);
	            System.out.println("fullMessage:"+fullMessage);
	            System.out.println("commitId:"+commitId);
	            
	            LogEntry log = new LogEntry();
	            log.setCommitId(commitId);
	            log.setCommitUser(commitUser);
	            log.setCommitMsg(fullMessage);
	            log.setCommitTime(commitTime);
	            logList.add(log);
	        }
	        
	        CloseRepos();
	        return logList;
	    } catch (Exception e) {
			System.out.println("getHistoryLogs Error");	
			e.printStackTrace();
			CloseRepos();
			return null;
		}
    }

    public List<ChangedItem> getHistoryDetail(Doc doc, String commitId) {
		String revision = "HEAD";
		if(commitId != null)
		{
			revision = commitId;
		}
		
    	if(OpenRepos() == false)
    	{
        	System.out.println("getHistoryDetail() Failed to open git repository");
    		return null;
    	}
    	
    	List<ChangedItem> changedItemList = getHistoryDetailBasic(doc, revision);
    	
        CloseRepos();
        return changedItemList;
    }
    
	private List<ChangedItem> getHistoryDetailBasic(Doc doc, String revision) {
		String entryPath = doc.getPath() + doc.getName();
    	//System.out.println("getHistoryDetail entryPath:" + entryPath);	
		
		List<ChangedItem> changedItemList = new ArrayList<ChangedItem>();
		
		try {
	        //Get objId for revision
	        ObjectId objId = repository.resolve(revision);
	        if(objId == null)
	        {
	        	System.out.println("getHistoryDetail() There is no any commit history for repository:"  + gitDir + " at revision:"+ revision);
	        	CloseRepos();	
	        	return changedItemList;
	        }
	        
	        RevCommit revCommit = walk.parseCommit(objId);
	        RevCommit previsouCommit=getPrevHash(revCommit,repository);

	        if(previsouCommit == null)	//It is first commit, so all Items was new added
	        {
    			System.out.println("getHistoryDetail() previsouCommit is null, so It is first Commit"); 

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
	    	    		//System.out.println("getHistoryDetail() entry nodePath:" + nodePath); 
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
	    			System.out.println("getHistoryDetail() treeWalk.next() Exception"); 
	                e.printStackTrace();
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
		          //System.out.println("getHistoryDetail() Entry: " + entry);
		          
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
			System.out.println("getHistoryDetail() entryPath:" + entryPath + " 异常");	
			e.printStackTrace();
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
    
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public TreeWalk getSubEntries(String remoteEntryPath, String revision) 
	{    	
    	//System.out.println("getSubEntries() revision:" + revision);
    	if(OpenRepos() == false)
    	{
        	System.out.println("getSubEntries() Failed to open git repository");
    		return null;
    	}
    	
        try {
            
            RevTree revTree = getRevTree(revision);
            if(revTree == null)
            {
            	System.out.println("getSubEntries() Failed to get revTree for:" + remoteEntryPath + " at revision:" + revision);
            	CloseRepos();
            	return null;            	
            }
            
            TreeWalk treeWalk = getTreeWalkByPath(revTree, remoteEntryPath);
            if(treeWalk == null) 
            {
            	System.out.println("getSubEntries() Failed to get treeWalk for:" + remoteEntryPath + " at revision:" + revision);
            	CloseRepos();
            	return null;
            }
            
            if(remoteEntryPath.isEmpty())
            {
            	CloseRepos();
            	return treeWalk;
            }
	        
            if(treeWalk.isSubtree())
	        {
            	treeWalk.enterSubtree();
            	CloseRepos();
            	return treeWalk;
	        }
	        else
	        {
	        	System.out.println("getSubEntries() treeWalk for:" + remoteEntryPath + " is not directory");
	        	CloseRepos();
	            return null;
	        }            
        } catch (Exception e) {
            System.out.println("getSubEntries() getTreeWalkByPath Exception"); 
            e.printStackTrace();
            CloseRepos();
            return null;
         }
	}
	
	//get the subEntryList under remoteEntryPath,only useful for Directory
	public List<Doc> getDocList(Repos repos, Doc doc, String revision)
	{
		if(OpenRepos() == false)
		{
			System.out.println("getDocList() Failed to OpenRepos git repository:" + gitDir);
        	return null;
		}
		
		String entryPath = doc.getPath() + doc.getName();
		
		List <Doc> subEntryList =  new ArrayList<Doc>();
    	RevTree revTree = getRevTree(revision);
    	if(revTree == null)
    	{
    		
    		CloseRepos();
    		if(entryPath.isEmpty())
    		{
    			System.out.println("getDocList() There is no any commit for repos:" + gitDir);    			
    			return subEntryList;
    		}
    		return null;
    	}

        TreeWalk treeWalk = getSubEntries(entryPath, revision);
        if(treeWalk == null)
        {
        	CloseRepos();
        	return null;
        }    

        String subDocParentPath = entryPath + "/";
		if(doc.getName().isEmpty())
		{
			subDocParentPath = doc.getPath();
		}
		
		int subDocLevel = doc.getLevel() + 1;            
		try {
			while(treeWalk.next())
	    	{
	    		int type = getEntryType(treeWalk.getFileMode(0));
		    	if(type <= 0)
		    	{
		    		continue;
		    	}
		    	
	    		String name = treeWalk.getNameString();            			
	    		Doc subDoc = new Doc();
	    		subDoc.setVid(repos.getId());
	    		subDoc.setDocId(buildDocIdByName(subDocLevel,subDocParentPath,name));
	    		subDoc.setPid(doc.getDocId());
	    		subDoc.setPath(subDocParentPath);
	    		subDoc.setName(name);
	    		subDoc.setLevel(subDocLevel);
	    		subDoc.setType(type);
	    		subDoc.setLocalRootPath(doc.getLocalRootPath());
	    		subDoc.setLocalVRootPath(doc.getLocalVRootPath());
	    		//GIT的tree包含了在当前版本上存在的目录树信息，但并不知道这个目录树上每个节点的大小和最近一次的提交信息（因为有些节点不是在当前版本修改的）
	    		//所以需要size是通过获取节点的blod信息来获取的，而文件的最近提交信息怎是要通过查询节点最近的一次log来获取
	    		//为什么这么做主要是由GIT仓库的实现方式决定的 RevCommit[Tree[blob/Tree]]
//	    		ObjectId objectId = treeWalk.getObjectId(0);	//不知道为什么在这里获取到的objectId是Null
//                ObjectLoader loader = repository.open(objectId);
//                subDoc.setSize(loader.getSize());
	    		//subDoc.setLatestEditTime(commitTime);
	    		//subDoc.setRevision(commitId);

	    		subEntryList.add(subDoc);
	    	}
		} catch(Exception e){
			System.out.println("getDocList() treeWalk.next() Exception"); 
            e.printStackTrace();
            CloseRepos();
			return null;
		}

		//由于通过treeWalk只是获取了这个Revision上的村子的文件节点（换句话说，在这个revision上存在的文件节点，并不意味着这个文件节点在这个revision上有变更）
        //由于目前的同步方案是通过文件节点的revision来确定文件是否被更新，因此必须获取文件节点真正有变更的最新revision，SVN在遍历节点时能够直接取到，
        //但GIT就目前而言需要额外去获取对应文件的最新版本
        //getTheRealLatestRevision For File
        if(subEntryList != null)
        {
        	for(int i=0; i< subEntryList.size(); i++)
        	{
        		Doc subDoc = subEntryList.get(i);
        		RevCommit subDocRevisionCommit = getLatestRevCommit(subDoc);
        		if(subDocRevisionCommit != null)
        		{
        			subDoc.setRevision(subDocRevisionCommit.getName());
        			subDoc.setLatestEditTime(convertCommitTime(subDocRevisionCommit.getCommitTime()));	
        		}
        		else
        		{
        			System.out.println("getDocList() Failed to get revision for " + subDoc.getPath() + subDoc.getName());
        		}
        	}
        }
        
		CloseRepos();
        return subEntryList;
	}
	
	public Integer checkPath(String entryPath, String revision) 
	{	
    	if(OpenRepos() == false)
    	{
        	System.out.println("checkPath() Failed to open git repository");
    		return null;
    	}
    	
        RevTree revTree = getRevTree(revision);
        if(revTree == null)
        {
        	CloseRepos();
        	return 0;
        }
	   
        TreeWalk treeWalk = getTreeWalkByPath(revTree, entryPath);
	    if(treeWalk == null)
	    {
	    	CloseRepos();
	    	return 0;
	    }
	    
        if(entryPath.isEmpty())
	    {
        	//For root path, FileMode is null
        	CloseRepos();
	        return 2;
	    }
	    
        int type = getEntryType(treeWalk.getFileMode());
	    CloseRepos();
        return type;
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
            	System.out.println("getRevTree() there is no any history for repository:" + gitDir + " at revision:" + revision);
            	return null;
            }
        
            RevCommit revCommit = walk.parseCommit(objId);
            if(revCommit == null)
            {
            	System.out.println("getRevTree() parseCommit Failed");
            	return null;
            }
        
            RevTree revTree = revCommit.getTree();
            return revTree;
		} catch (Exception e) {
	    	System.out.println("getRevTree() 异常");
	        e.printStackTrace();
		}
        return null;
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
	
	public List<Doc> getEntry(Doc doc, String localParentPath, String targetName,String revision, boolean force, HashMap<String, String> downloadList) {
		System.out.println("getEntry() revision:" + revision + " 注意递归过程中，该值必须不变");
		
		String parentPath = doc.getPath();
		String entryName = doc.getName();
		
		
		//System.out.println("getEntry() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
		List<Doc> successDocList = new ArrayList<Doc>();
		
		//check targetName and set
		if(targetName == null)
		{
			targetName = entryName;
		}
		
		String remoteEntryPath = parentPath + entryName;
		Doc remoteDoc = getDoc(doc, revision);
		if(remoteDoc == null)
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
		
		//远程节点是文件，本地节点不存在则checkOut，否则只有在force==true时才会checkOut
		if(remoteDoc.getType() == 1) 
		{	
			if(downloadList != null)
			{
				Object downloadItem = downloadList.get(remoteEntryPath);
				if(downloadItem == null)
				{
					//System.out.println("getEntry() " + remoteEntryPath + " 不在下载列表,不下载！"); 
					return null;
				}
				else
				{
					//System.out.println("getEntry() [" + remoteEntryPath + "] 在下载列表,需要下载！"); 
					downloadList.remove(downloadItem);
				}
			}

			//System.out.println("getEntry() getRemoteFile [" + remoteEntryPath + "]"); 
			if(getRemoteFile(remoteEntryPath, localParentPath, targetName, revision, force) == false)
			{
				System.out.println("getEntry() getRemoteFile Failed:" + remoteEntryPath); 
				return null;
			}
			
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
		
		//远程节点存在，如果是目录的话（且不是根目录），则先新建本地目录，然后在CheckOut子目录，如果是根目录则直接CheckOut子目录，因为本地根目录必须存在
		if(remoteDoc.getType() == 2) 
		{
			//CheckOut Directory
			File localEntry = new File(localParentPath + targetName);
			if(force == false)
			{
				if(localEntry.exists())
				{
					if(localEntry.isFile())
					{
						System.out.println("getEntry() " + localParentPath + targetName + " 是文件，已存在"); 					
						return null;
					}
				}
				else
				{
					if(localEntry.mkdir() == false)
					{
						System.out.println("getEntry() mkdir failed:" + localParentPath + targetName); 					
						return null;
					}
					
			        //Add to success Doc to Checkout list	
			        doc.setType(2);
					doc.setRevision(remoteDoc.getRevision());
					successDocList.add(doc);
				}
			}
			else
			{
				if(localEntry.exists() == false)
				{
					if(localEntry.mkdir() == false)
					{
						return null;
					}
					//Add to success Checkout list	
					doc.setType(2);
					doc.setRevision(remoteDoc.getRevision());
					successDocList.add(doc);
				}
				else
				{
					if(localEntry.isFile())
					{	
						if(delFileOrDir(localParentPath+targetName) == false)
						{
							return null;
						}
						if(localEntry.mkdir() == false)
						{
							return null;
						}
						//Add to success Checkout list	
						doc.setType(2);
						doc.setRevision(remoteDoc.getRevision());
						successDocList.add(doc);
					}
				}		
			}
        	
			//To Get SubDocs
			if(downloadList != null && downloadList.size() == 0)
			{
				System.out.println("getEntry() downloadList is empty"); 
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
			
			TreeWalk treeWalk = getSubEntries(remoteEntryPath,revision);
			if(treeWalk == null)
			{
				return successDocList;
			}
			
		    try {
				while (treeWalk.next()) 
				{
					String subEntryName = treeWalk.getNameString();
					Integer subEntryType = getEntryType(treeWalk.getFileMode());
					
					//注意: checkOut时必须使用相同的revision，successList中的可以是实际的，在获取子文件时绝对不能修改revision，那样就引起的时间切面不一致
					//这个问题导致了，自动同步出现问题（远程同步用的就是getEntry接口），导致远程同步后的dbDoc与实际的revision不一致
					//String subEntryRevision = revision;	//绝对不能用这个，只要保证revision不被修改就会一直是同一个值
					Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subDocParentPath, subEntryName, subDocLevel,subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, "");
					List<Doc> subSuccessList = getEntry(subDoc, subEntryLocalParentPath,subEntryName,revision, force, downloadList);
					if(subSuccessList != null && subSuccessList.size() > 0)
					{
						successDocList.addAll(subSuccessList);
					}					
				}
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		  
		    return successDocList;
        }
		
		return null;
	}
	
	public String getReposPreviousCommmitId(String commitId) 
	{
		String revision = "HEAD";
		if(commitId != null)
		{
			revision = commitId;
		}
		
		try {
			Git git = Git.open(new File(gitDir));
			Repository repository = git.getRepository();
	        
	        //New RevWalk
	        RevWalk walk = new RevWalk(repository);
	
	        //Get objId for revision
	        ObjectId objId = repository.resolve(revision);
	        if(objId == null)
	        {
	        	System.out.println("getPreviousCommmitId() There is no any commit history for repository:"  + gitDir + " at revision:"+ revision);
	        	walk.close();
	        	repository.close();
	        	return null;
	        }
	        
	        RevCommit revCommit = walk.parseCommit(objId);
	        RevCommit previsouCommit=getPrevHash(revCommit,repository);
			walk.close();
			repository.close();
			
			return previsouCommit.getName();
		} catch (Exception e) {
			System.out.println("getPreviousCommmitId() for:" + revision + " 异常");	
			e.printStackTrace();
		}	
		
		return null;
	}

	private boolean getRemoteFile(String remoteEntryPath, String localParentPath, String targetName, String revision, boolean force) 
	{
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
				checkAddLocalDirectory(localParentPath);
			}
		}
		else	//强行 checkOut
		{
			if(localEntry.exists())
			{
				if(localEntry.isDirectory())	//本地是目录，如果需要先删除
				{
					if(delFileOrDir(localParentPath+targetName) == false)
					{
						return false;
					}
				}
			}
			else
			{
				//检查父节点是否存在，不存在则自动创建
				checkAddLocalDirectory(localParentPath);
			}
		}
		
        if(OpenRepos() == false)
        {
			System.out.println("getRemoteFile() Failed to open git repository:" + gitDir);
        	return false;
        }

        RevTree revTree = getRevTree(revision);
        if(revTree == null)
        {
        	CloseRepos();
        	return false;
        }

		TreeWalk treeWalk = getTreeWalkByPath(revTree, remoteEntryPath);
		if(treeWalk == null)
		{
			System.out.println("getRemoteFile() treeWalk is null for:" + remoteEntryPath);
			CloseRepos();
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
			System.out.println("getRemoteFile() new FileOutputStream Failed:" + localParentPath + targetName);
			e.printStackTrace();
	        CloseRepos();
			return false;
		}
		
		try {
	        ObjectId blobId = treeWalk.getObjectId(0);
	        ObjectLoader loader = repository.open(blobId);
	        System.out.println("getRemoteFile() at " + revision + " " + remoteEntryPath + " size:" + loader.getSize());	//文件大小
	        loader.copyTo(out);
	        out.close();
	        out = null;
		} catch (Exception e) {
			System.out.println("getRemoteFile() loader.copy Failed:" + localParentPath + targetName);
			e.printStackTrace();
			CloseRepos();
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
        
        CloseRepos();
        return true;
	}

	private TreeWalk getTreeWalkByPath(RevTree revTree, String entryPath) {
		//System.out.println("getTreeWalkByPath() entryPath:" + entryPath); 

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
            System.out.println("getTreeWalkByPath() Exception"); 
            e.printStackTrace();
        }
		return null;
	}

	public String doAutoCommit(Doc doc, String commitMsg,String commitUser, boolean modifyEnable, HashMap<Long, DocChange> localChanges, int subDocCommitFlag, List<CommitAction> commitActionList) 
	{		
		String localRootPath = doc.getLocalRootPath();
		String localRefRootPath = doc.getLocalRefRootPath();
		
		System.out.println("doAutoCommit()" + " parentPath:" + doc.getPath() +" entryName:" + doc.getName() +" localRootPath:" + localRootPath + " commitMsg:" + commitMsg +" modifyEnable:" + modifyEnable + " localRefRootPath:" + localRefRootPath);
    	
		if(commitActionList == null)
		{
			commitActionList = new ArrayList<CommitAction>();
		}
		
		String entryPath = doc.getPath() + doc.getName();			
		File localEntry = new File(localRootPath + entryPath);
		
		//LocalEntry does not exist
		if(!localEntry.exists())	//Delete Commit
		{
			System.out.println("doAutoCommit() localEntry " + localRootPath + entryPath + " not exists");
			Integer type = checkPath(entryPath, null);
		    if(type == null)
		    {
		    	return null;
		    }
		    
		    if(type == 0)
		    {
				System.out.println("doAutoCommit() remoteEnry " + entryPath + " not exists");
		        return getLatestRevision(doc);
		    }

    		insertDeleteAction(commitActionList,doc, true);
		}
		else
		{		
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
				System.out.println("doAutoCommit() checkPath for " + doc.getPath() + " 异常");
				return null;
			}
	
			//如果远程的父节点不存在且不是根节点，那么调用doAutoCommitParent
			if(type == 0)
			{					
				if(!doc.getPath().isEmpty())
				{
					System.out.println("doAutoCommit() parent entry " + doc.getPath() + " not exists, do commit parent");
					return doAutoCommitParent(doc, commitMsg, commitUser, modifyEnable, commitActionList);
				}
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
	        		System.out.println("doAutoCommit() 新增文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
	    			insertAddFileAction(commitActionList,doc,false, true);
			    }
			    else if(type != 1)
			    {
			    	System.out.println("doAutoCommit() 文件类型变更(目录->文件):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
		    		insertDeleteAction(commitActionList,doc, true);
	    			insertAddFileAction(commitActionList,doc,false, true);
			    }
			    else
			    {
		    		//如果commitHashMap未定义，那么文件是否commit由modifyEnable标记决定
		    		if(localChanges == null) //文件内容改变	
		    		{
			            if(modifyEnable)
			            {
		            		System.out.println("doAutoCommit() 文件内容变更:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
		            		insertModifyAction(commitActionList,doc, true);
		            	}
		    		}
		    		else
		    		{
		    			DocChange docChange = localChanges.get(doc.getDocId());
		    			if(docChange != null)
		    			{
		    				if(docChange.getType() == DocChangeType.LOCALCHANGE)
		    				{
			            		System.out.println("doAutoCommit() 文件内容变更（localChanges）:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			            		insertModifyAction(commitActionList,doc, true);
		    				}
		    			}
		    		}
			    }
			}
			else
			{
				//LocalEntry is Directory
				System.out.println("doAutoCommit() localEntry " + localRootPath + entryPath + " is Directory");
				scheduleForCommit(commitActionList, doc, modifyEnable, false, localChanges, subDocCommitFlag);
			}
		}
		
		if(commitActionList == null || commitActionList.size() ==0)
		{
		    System.out.println("doAutoCommmit() There is nothing to commit");
		    return getLatestReposRevision();
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
	    
	    String newRevision =  doCommit(git, commitUser, commitMsg, commitActionList);
	    
	    if(newRevision == null)
	    {
	    	//Do rollBack
			//Do roll back Index
			rollBackIndex(git, entryPath, null);
			rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录	
			git.close();
			return null;
	    }
	    
	    git.close();
	    return newRevision;
	}
	
	//move or copy Doc
	public String copyDoc(Doc srcDoc, Doc dstDoc, String commitMsg,String commitUser,boolean isMove, List<CommitAction> commitActionList)
	{   
		String srcEntryPath = srcDoc.getPath() + srcDoc.getName();
		Integer type = checkPath(srcEntryPath,null);
		if(type == null)
		{
			System.out.println("copyDoc() Exception");
			return null;
		}
		
		if (type == 0) 
		{
		    System.out.println("copyDoc() There is no entry for " + srcEntryPath + " at latest revision");
		    return null;
		}

		String dstEntryPath = dstDoc.getPath() + dstDoc.getName();
		
		if(commitActionList == null)
		{
			commitActionList = new ArrayList<CommitAction>();
		}
		
	    //Do copy File Or Dir
	    if(isMove)
	    {
	    	System.out.println("copyDoc() move " + srcEntryPath + " to " + dstEntryPath);
   			insertDeleteAction(commitActionList,srcDoc, true);
	    }
        else
        {
 	       System.out.println("copyDoc() copy " + srcEntryPath + " to " + dstEntryPath);
 	    }
	    
		if(dstDoc.getType() == 1)
		{
			insertAddFileAction(commitActionList, dstDoc,false, true);
		}
		else
		{
			insertAddDirAction(commitActionList, dstDoc,false, true);
		}
	    
		Git git = null;
		try {
			git = Git.open(new File(wcDir));
		} catch (Exception e) {
			System.out.println("copyDoc() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return null;
		}
		
	    if(executeCommitActionList(git,commitActionList,true) == false)
	    {
	    	System.out.println("copyDoc() executeCommitActionList Failed");
	    	git.close();
	        return null;
	    }
	    
	    String newRevision =  doCommit(git, commitUser, commitMsg, commitActionList);
	    
	    if(newRevision == null)
	    {
	    	//Do rollBack
			//Do roll back Index
	    	if(isMove)
	    	{
	    		rollBackIndex(git, srcEntryPath, null);
	    	}
	    	
	    	rollBackIndex(git, dstEntryPath, null);
			rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录	
	    	git.close();
			return null;
	    }
	    
	    git.close();
	    return newRevision;
	}

	private String doCommit(Git git, String commitUser, String commitMsg, List<CommitAction> commitActionList) 
	{		
        RevCommit ret = null;
        try {
			ret = git.commit().setCommitter(commitUser, "").setMessage(commitMsg).call();
			System.out.println("doAutoCommmit() commitId:" + ret.getName());
		} catch (Exception e) {
			System.out.println("doAutoCommmit() commit error");
			e.printStackTrace();
			return null;
		}
		return ret.getName();
	}
	
	public boolean doPushEx()
	{
		//For local Git Repos, no need to do fetch
		if(isRemote == false)
		{
			return true;
		}
		
    	if(OpenRepos() == false)
    	{
        	System.out.println("doPush() Failed to open git repository");
    		return false;
    	}
    	
    	boolean ret = doPush(git, repository);
    	
    	CloseRepos();
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

	        CloseRepos();
	        printObject("doPush() PushResult:", status);
	       
	        if(status.name().equals("OK") || status.name().equals("UP_TO_DATE"))
	        {
	        	System.out.println("doPush() Push OK");	    	
		        return true;		        	
	        }

			System.out.println("doPush() Push Failed");
			return false;
		} catch (Exception e) {
			System.out.println("doPush() Push Exception");	
			e.printStackTrace();
			return false;
		}
	}
	
	public boolean doFetch()
	{
		//For local Git Repos, no need to do fetch
		if(isRemote == false)
		{
			return true;
		}
		
    	if(OpenRepos() == false)
    	{
        	System.out.println("doFetch() Failed to open git repository");
    		return false;
    	}
    
		FetchCommand fetchCmd = git.fetch();
		if(user != null && !user.isEmpty())
		{
			UsernamePasswordCredentialsProvider cp = new UsernamePasswordCredentialsProvider(user, pwd);
			fetchCmd.setCredentialsProvider(cp);
		}
		
		try {
			FetchResult fetchResult = fetchCmd.call();
		    printObject("doFetch() fetchResult:", fetchResult);
			
			TrackingRefUpdate refUpdate = fetchResult.getTrackingRefUpdate( "refs/remotes/origin/master" );
			if(refUpdate == null)
			{
	        	System.out.println("doFetch() Nothing was changed on remote branch: refs/remotes/origin/master");
			}
			else
			{
				Result result = refUpdate.getResult();
			    printObject("doFetch() result:", result);
			}
		    CloseRepos();
		    return true;
	    } catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		    CloseRepos();
			return false;
	    }
	}
	
	//doPullEx 保证pull一定成功
	public boolean doPullEx()
	{
		//For local Git Repos, no need to do rebase
		if(isRemote == false)
		{
			return true;
		}
		
    	if(OpenRepos() == false)
    	{
        	System.out.println("doPullEx() Failed to open git repository");
    		return false;
    	}

		if(checkAndCleanBranch(git, repository, "master") == false)
		{
			System.out.println("doPullEx() Failed to checkAndCleanBranch");
    		return false;
		}
		
    	boolean ret = doPull(git, repository);
    	
    	CloseRepos();

    	return ret;
	}
	
	public boolean checkAndClearnBranch()
	{
    	if(OpenRepos() == false)
    	{
        	System.out.println("checkAndClearnBranch() Failed to open git repository");
    		return false;
    	}

		if(checkAndCleanBranch(git, repository, "master") == false)
		{
	    	CloseRepos();
			System.out.println("checkAndClearnBranch() Failed to checkAndCleanBranch");
			return false;
		}

		CloseRepos();
    	return true;
	}
	
	
	public boolean checkAndCleanBranch(Git git, Repository repo, String branchName) 
	{
		System.out.println("checkAndCleanBranch branchName:" + branchName);
		
		//Get curBranchName and check if curBranch is correct
		String curBranchName = null;
		try {
			String fullBranch = repo.getFullBranch();
			if (fullBranch != null
					&& fullBranch.startsWith(Constants.R_HEADS)) {
				curBranchName = fullBranch.substring(Constants.R_HEADS.length());
			}
		} catch (IOException e) {
			System.out.println("checkAndCleanBranch get branchName Exception");
			e.printStackTrace();
			return false;
		}
		if(curBranchName == null || !curBranchName.equals(branchName))
		{
			System.out.println("checkAndCleanBranch curBranchName not matched:" + curBranchName);
			Ref ret = null;
			try {
				ret = git.checkout().setName(branchName).call();
			} catch (Exception e) {
				e.printStackTrace();
				return false;
			} 
			
			if(ret == null)
			{
				System.out.println("checkAndCleanBranch failed to checkout branch:" + branchName);
				return false;
			}
		}
		
		//Check and Clean Branch
		try {
			org.eclipse.jgit.api.Status status = git.status().call();
            System.out.println("Git Change: " + status.getChanged());
            System.out.println("Git Modified: " + status.getModified());
            System.out.println("Git UncommittedChanges: " + status.getUncommittedChanges());
            System.out.println("Git Untracked: " + status.getUntracked());
            if(status.isClean())
            {
				System.out.println("checkAndCleanBranch branch is clean");            	
            	return true;
            }
            
    		System.out.println("checkAndCleanBranch branch is dirty, doCleanBranch");        	
            return doCleanBranch(git, repo, status);            
		} catch (Exception e) {
			System.out.println("checkAndCleanBranch check and clean branch Exception");
			e.printStackTrace();
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
			e.printStackTrace();
			return false;
		}
		System.out.println("doPullEx branchName:" + branchName);
		
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
		System.out.println("doPullEx remoteBranchName:" + remoteBranchName);			
		if (remoteBranchName == null) {
			return false;
		}
		
		RepositoryState reposState = repo.getRepositoryState();
		if (!reposState.equals(RepositoryState.SAFE))
		{
			System.out.println("doPullEx repos is not safe now:" + 	reposState);
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
			e.printStackTrace();
			return false;
		}
		
		printObject("doPullEx fetchRes:", fetchRes);
		
		Ref r = null;
		if (fetchRes != null) {
			r = fetchRes.getAdvertisedRef(remoteBranchName);
			if (r == null)
				r = fetchRes.getAdvertisedRef(Constants.R_HEADS
						+ remoteBranchName);
		}
		if (r == null) {
			System.out.println("doPullEx success: Nothing was updated on remote");
			return true;
		}

		AnyObjectId commitToMerge = r.getObjectId();
		String remoteUri = repoConfig.getString(
				ConfigConstants.CONFIG_REMOTE_SECTION, remote,
				ConfigConstants.CONFIG_KEY_URL);
		
		System.out.println("doPullEx remoteUri:" + remoteUri);
		if (remoteUri == null) {
			return false;
		}

		String upstreamName = MessageFormat.format(
				JGitText.get().upstreamBranchName,
				Repository.shortenRefName(remoteBranchName), remoteUri);
		System.out.println("doPullEx upstreamName:" + upstreamName);
		
		RebaseCommand rebase = git.rebase();
		RebaseResult rebaseRes;
		try {
			rebaseRes = rebase.setUpstream(commitToMerge).setUpstreamName(upstreamName).call();
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		
		org.eclipse.jgit.api.RebaseResult.Status status = rebaseRes.getStatus();
		printObject("doPullEx rebase status:",status);
		if(status.isSuccessful())
		{
			System.out.println("doPullEx success: rebase OK");
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
			e.printStackTrace();
		} catch (RefNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (WrongRepositoryStateException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (GitAPIException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
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
			e.printStackTrace();
		} catch (RefNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (WrongRepositoryStateException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (GitAPIException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return false;
	}

	private boolean doFixRebaseConflict(Git git, Repository repo, RebaseResult rebaseRes) {
		//将冲突的文件更新为当前commit
		printObject("doFixRebaseConflict rebase rebaseRes.getConflicts():",rebaseRes.getConflicts());
		printObject("doFixRebaseConflict rebase rebaseRes.getFailingPaths:",rebaseRes.getFailingPaths());
		printObject("doFixRebaseConflict rebase rebaseRes.getUncommittedChanges():",rebaseRes.getUncommittedChanges());
		
		printObject("doFixRebaseConflict rebase rebaseRes.getCurrentCommit():",rebaseRes.getCurrentCommit().getName());
		String revision = rebaseRes.getCurrentCommit().getName();
		
		RevTree revTree = rebaseRes.getCurrentCommit().getTree();
        if(revTree == null)
        {
        	System.out.println("doFixRebaseConflict revTree is null for revision:" + rebaseRes.getCurrentCommit().getName());
        	return false;
        }
        
		org.eclipse.jgit.api.Status status;
		try {
			status = git.status().call();
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		
        System.out.println("Git Change: " + status.getChanged());
        System.out.println("Git Modified: " + status.getModified());
        System.out.println("Git UncommittedChanges: " + status.getUncommittedChanges());
        System.out.println("Git Untracked: " + status.getUntracked());
        if(status.isClean())
        {
			System.out.println("checkAndCleanBranch branch is clean");            	
        	return true;
        }
        //Do revert conflict files one by one
        Iterator<String> iter = status.getUncommittedChanges().iterator();
        while(iter.hasNext())
        {
        	String entryPath = iter.next();
        	System.out.println("doFixRebaseConflict entryPath:" + entryPath);
        	
        	TreeWalk treeWalk = getTreeWalkByPath(revTree, entryPath);
        	if(treeWalk == null)
        	{
        		System.out.println("doFixRebaseConflict() treeWalk is null for:" + entryPath);
        		return false;
        	}

        	String wcEntryPath = wcDir + entryPath;
        	FileOutputStream out = null;
			try {
				out = new FileOutputStream(wcEntryPath);
			} catch (Exception e) {
				System.out.println("doFixRebaseConflict() new FileOutputStream Failed:" + wcEntryPath);
				e.printStackTrace();
				return false;
			}
			
			try {
		        ObjectId blobId = treeWalk.getObjectId(0);
		        ObjectLoader loader = repository.open(blobId);
		        System.out.println("doFixRebaseConflict() at " + revision + " " + entryPath + " size:" + loader.getSize());	//文件大小
		        loader.copyTo(out);
		        out.close();
		        out = null;
		        //Add to Index 
				git.add().addFilepattern(entryPath).call();
			} catch (Exception e) {
				System.out.println("doFixRebaseConflict() loader.copy Failed:" + wcEntryPath);
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
			System.out.println("ResetWcDir() Failed to open wcDir:" + wcDir);
			e.printStackTrace();
			return false;
		}			    
	}

	//Revert Commit
	public boolean revertCommit(Git git, Repository repository, String revision) {
		if(revision == null) 
		{
			revision = "HEAD";
		}
		
		try {
			ObjectId objId = repository.resolve(revision);
			RevCommit revCommit = walk.parseCommit(objId);  
	        String preVision = revCommit.getParent(0).getName();  
	        
	        return doResetBranch(git, preVision);
		} catch (Exception e) {
			System.out.println("rollBackCommit() Exception");
			e.printStackTrace();
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
			System.out.println("rollBackIndex() Exception");
			e.printStackTrace();
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
        		delFileOrDir(wcDir + doc.getPath() + doc.getName());
    		}
    	}
	}
	

	private boolean executeCommitActionList(Git git, List<CommitAction> commitActionList,boolean openRoot) {
    	System.out.println("executeCommitActionList() szie: " + commitActionList.size());
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
			System.out.println("executeCommitActionList() 异常");	
			e.printStackTrace();
			return false;
		}
	}
	
	private boolean executeModifyAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();
		
		//printObject("executeModifyAction:", doc);
		System.out.println("executeModifyAction() " + doc.getPath() + doc.getName());
		
		if(!modifyFile(git, doc))
		{
			action.setResult(false);
			return false;
		}
		return true;
	}

	private boolean executeDeleteAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();

		//printObject("executeDeleteAction:", doc);
		System.out.println("executeDeleteAction() " + doc.getPath() + doc.getName());
		if(!deleteEntry(git, doc))
		{
			action.setResult(false);
			return false;
		}
		return true;
	}
	
	private boolean executeAddAction(Git git, CommitAction action) {
		Doc doc = action.getDoc();
	
		//printObject("executeAddAction:", doc);
		System.out.println("executeAddAction() " + doc.getPath() + doc.getName());
		
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
    	String docPath = doc.getLocalRootPath() + entryPath;
		String wcDocPath = wcDir + entryPath;
    	
    	if(copyFile(docPath, wcDocPath, true) == false)
		{
			System.out.println("modifyFile() copy File to WD error");					
			return false;
		}
    	
    	try {	
			git.add().addFilepattern(entryPath).call();
		} catch (Exception e) {
			System.out.println("addEntry() add Index Error");	
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
			System.out.println("deleteEntry() delete WD Error");	
			return false;
		}
		
		try {	
			git.rm().addFilepattern(entryPath).call();
		} catch (Exception e) {
			System.out.println("addEntry() add Index Error");	
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
			if(copyFile(docPath, wcDocPath, true) == false)
			{
				System.out.println("addEntry() copyFile from " + docPath + " to " + wcDocPath + " 失败");		
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
					System.out.println("addEntry() mkdir for " + wcDocPath + " 失败");					
					return false;
				}
			}
		}
		
		try {	
			git.add().addFilepattern(entryPath).call();
		} catch (Exception e) {
			System.out.println("addEntry() git.add.addFilepattern.call for " + entryPath + " 失败");	
			e.printStackTrace();
			return false;
		}
		return true;
	}
  	
	private void scheduleForCommit(List<CommitAction> actionList, Doc doc, boolean modifyEnable,boolean isSubAction, HashMap<Long, DocChange> localChanges, int subDocCommitFlag) {
		
		String localRootPath = doc.getLocalRootPath();
		//System.out.println("scheduleForCommit()  localRootPath:" + localRootPath + " modifyEnable:" + modifyEnable + " subDocCommitFlag:" + subDocCommitFlag + " doc:" + doc.getPath() + doc.getName());
		
    	if(doc.getName().isEmpty())
    	{
    		scanForSubDocCommit(actionList, doc, modifyEnable, isSubAction, localChanges, subDocCommitFlag);
    		return;
    	}
    	
    	if(doc.getName().equals(".git"))
    	{
    		System.out.println("scheduleForCommit() .git was ignored");
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
    		insertDeleteAction(actionList,doc, true);
    		return;
    	}
    	
    	//本地存在
    	int localEntryType = localEntry.isDirectory()? 2:1;
    	switch(localEntryType)
    	{
    	case 1:	//文件
    		if(type == 0) 	//新增文件
	    	{
    			insertAddFileAction(actionList,doc,isSubAction, true);
	            return;
    		}
    		
    		if(type != 1)	//文件类型改变
    		{
    			insertDeleteAction(actionList,doc, true);
    			insertAddFileAction(actionList,doc,isSubAction, true);
	            return;
    		}
    		
    		//如果commitHashMap未定义，那么文件是否commit由modifyEnable标记决定
    		if(localChanges == null) //文件内容改变	
    		{
	            if(modifyEnable)
	            {
            		System.out.println("scheduleForCommit() insert " + entryPath + " to actionList for Modify" );
            		insertModifyAction(actionList,doc, true);
            		return;
            	}
    		}
    		else
    		{
    			DocChange docChange = localChanges.get(doc.getDocId());
    			if(docChange != null)
    			{
    				if(docChange.getType() == DocChangeType.LOCALCHANGE)
    				{
	        			System.out.println("scheduleForCommit() insert " + entryPath + " to actionList for Modify" );
	            		insertModifyAction(actionList,doc, true);
	            		return;
    				}
    			}
    		}
    		break;
    	case 2:
    		if(type == 0) 	//新增目录
	    	{
    			//Add Dir
    			insertAddDirAction(actionList,doc,isSubAction, true);
	            return;
    		}
    		
    		if(type != 2)	//文件类型改变
    		{
    			insertDeleteAction(actionList,doc, true);
	        	insertAddDirAction(actionList,doc, isSubAction, true);
	            return;
    		}
    		
    		scanForSubDocCommit(actionList, doc, modifyEnable, isSubAction, localChanges, subDocCommitFlag);
    		break;
    	}
    	return; 
	}

	private void scanForSubDocCommit(List<CommitAction> actionList, Doc doc, boolean modifyEnable, boolean isSubAction, HashMap<Long, DocChange> localChanges,
			int subDocCommitFlag) {
		String localRootPath = doc.getLocalRootPath();
		String localRefRootPath = doc.getLocalRefRootPath();
		//System.out.println("scanForSubDocCommit()  parentPath:" + doc.getPath() + doc.getName() + " localRootPath:" + localRootPath + " localRefRootPath:" + localRefRootPath + " modifyEnable:" + modifyEnable + " subDocCommitFlag:" + subDocCommitFlag);
		
		if(subDocCommitFlag == 0) //不递归
		{
			return;
		}		
		if(subDocCommitFlag == 1)	//不可继承递归
		{
			subDocCommitFlag = 0;
		}
		
		//注意这个docHashMap只能在本函数下使用
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();

    	String subDocParentPath = doc.getPath() + doc.getName() + "/";
		if(doc.getName() == null || doc.getName().isEmpty())
		{
			 subDocParentPath = doc.getPath();
		}
		int subDocLevel = getSubDocLevel(doc);

		//遍历仓库所有子目录
		//System.out.println("scanForSubDocCommit() go through verRepos subDocs under:" + subDocParentPath);
		TreeWalk treeWalk = getSubEntries(subDocParentPath, null);
		if(treeWalk != null)
		{
	        try {
				while(treeWalk.next())
				{
					int subDocType = getEntryType(treeWalk.getFileMode());
				    Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subDocParentPath, treeWalk.getNameString(), subDocLevel, subDocType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, "");
		        	//System.out.println("scanForSubDocCommit() verRepos subDoc:" + subDoc.getName());

				    docHashMap.put(subDoc.getName(), subDoc);
				    scheduleForCommit(actionList, subDoc, modifyEnable, isSubAction, localChanges, subDocCommitFlag);
				}
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
        //Go Through localSubDocs
		//System.out.println("scanForSubDocCommit() go through local subDocs under:" + subDocParentPath);
        File dir = new File(localRootPath  + subDocParentPath);
        File[] tmp=dir.listFiles();
        for(int i=0;i<tmp.length;i++)
        {
        	File localSubEntry = tmp[i];
        	int subDocType = localSubEntry.isFile()? 1: 2;
        	Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subDocParentPath, localSubEntry.getName(), subDocLevel, subDocType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), localSubEntry.length(), "");
        	//System.out.println("scanForSubDocCommit() local subDoc:" + subDoc.getName());

        	if(docHashMap.get(subDoc.getName()) == null)
        	{
        		if(localSubEntry.isDirectory())
        		{
        			insertAddDirAction(actionList, subDoc, isSubAction, true);
        		}
        		else
        		{
        			insertAddFileAction(actionList, subDoc, isSubAction, true);
        		}
        	}
        }
	}

	private String doAutoCommitParent(Doc doc, String commitMsg,String commitUser, boolean modifyEnable, List<CommitAction> commitActionList)
    {
    	String parentPath = doc.getPath();
        System.out.println("doAutoCommitParent() parentPath:" + parentPath);
    	if(parentPath.isEmpty())
    	{
    		Doc rootDoc = buildBasicDoc(doc.getVid(), 0L, -1L, "", "", 0, 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
			if(commitActionList == null)
			{	
				commitActionList = new ArrayList<CommitAction>();
			}
			
    		insertAddDirAction(commitActionList, rootDoc, false, true);
    		
    		Git git = null;
    		try {
    			git = Git.open(new File(wcDir));
    		} catch (Exception e) {
    			System.out.println("doAutoCommitParent() Failed to open wcDir:" + wcDir);
    			e.printStackTrace();
    			return null;
    		}
    		
    	    if(executeCommitActionList(git,commitActionList,true) == false)
    	    {
    	    	System.out.println("doAutoCommitParent() executeCommitActionList Failed");
    	    	
    	        return null;
    	    }
    	    
    	    String newRevision =  doCommit(git, commitUser, commitMsg, commitActionList);
    	    
    	    if(newRevision == null)
    	    {
    	    	//Do rollBack
    			//Do roll back Index
    			rollBackIndex(git, parentPath, null);
    			rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录	
    	    	return null;
    	    }
    	    return newRevision;
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
	    			return doAutoCommit(tempDoc, commitMsg, commitUser, modifyEnable,null, 2, commitActionList);
	    		}
	    		path = path + name + "/";  		
	    	}
    	} catch (Exception e) {
    		System.out.println("doAutoCommitParent() Exception");
    		e.printStackTrace();
    	}
    	return null;
	}

	public boolean subEntriesIsEmpty(TreeWalk subEntries) {
		// TODO Auto-generated method stub
		if(subEntries == null)
		{
			return true;
		}
		
		try {
			while(subEntries.next())
	    	{
	    		int type = getEntryType(subEntries.getFileMode(0));
		    	if(type > 0)
		    	{
		    		return false;
		    	}
	    	}
		} catch(Exception e){
			System.out.println("getDocList() treeWalk.next() Exception"); 
            e.printStackTrace();
			return true;
		}
		return true;
	}
}
