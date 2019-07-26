package util.GitUtil;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import org.eclipse.jgit.api.CheckoutCommand;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ResetCommand.ResetType;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffEntry.ChangeType;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.PathFilter;

import com.DocSystem.common.CommitAction;
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
    
	//This is the latest revision for repos
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
    
    public String getLatestRevision(Doc doc) 
	{
    	String entryPath = doc.getPath() + doc.getName();
    
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
	            return commitId;
	        }
	        
	        return null;
	    } catch (Exception e) {
			System.err.println("getLatestRevision Error");	
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
    

	public List<ChangedItem> getHistoryDetail(Doc doc, String commitId) {
		String entryPath = doc.getPath() + doc.getName();
    	System.out.println("getHistoryDetail entryPath:" + entryPath);	
		
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
	        	System.err.println("getHistoryDetail() There is no any commit history for repository:"  + gitDir + " at revision:"+ revision);
	        	walk.close();
	        	repository.close();
	        	git.close();
	        	return null;
	        }
	        
	        RevCommit revCommit = walk.parseCommit(objId);
	        RevCommit previsouCommit=getPrevHash(revCommit,repository);
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
			walk.close();
			repository.close();
			git.close();			
			
			if(diffs.size() > 0)
			{
				//Convert diffEntry to changedItem
				List<ChangedItem> changedItemList = new ArrayList<ChangedItem>();
		        for (DiffEntry entry : diffs) 
		        {
		          System.out.println("getHistoryDetail() Entry: " + entry);
		          
		      	  String nodePath = entry.getNewPath();
		          Integer entryType = getTypeFromFileMode(entry.getNewMode());
		          Integer changeType = getChangeType(entry.getChangeType());
		
		          String srcEntryPath = entry.getOldPath();
		          
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
		} catch (Exception e) {
			System.err.println("getHistoryDetail() entryPath:" + entryPath + " 异常");	
			e.printStackTrace();
		}	
		
		return null;
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
	public List<Doc> getDocList(Repos repos, Doc doc, String revision)
	{
    	System.out.println("getDocList() revision:" + revision);
    	if(revision == null)
        {
        	revision = "HEAD";
        }
    	
        try {
            //gitDir表示git库目录
        	Git git = Git.open(new File(gitDir));
        	Repository repository = git.getRepository();
            
            //New RevWalk
            RevWalk walk = new RevWalk(repository);

            //Get objId for revision
            ObjectId objId = repository.resolve(revision);
            if(objId == null)
            {
            	System.err.println("getDocList() There is no any commit history for repository:"   + gitDir + " at revision:" + revision);
            	walk.close();
            	repository.close();
            	git.close();
            	return null;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);
            String commitId = revCommit.getName();	//revision
            long commitTime = revCommit.getCommitTime();	//commitTime
            RevTree revTree = revCommit.getTree();
            
            TreeWalk treeWalk = getTreeWalkByPath(repository, revTree, doc.getPath() + doc.getName());
            if(treeWalk == null) 
            {
            	System.err.println("getDocList() Failed to get treeWalk for:" + doc.getPath() + doc.getName() + " at revision:" + revision);
            	walk.close();
            	repository.close();
            	git.close();
            	return null;
            }
            
            if(doc.getDocId() != 0)
            {
	            if(treeWalk.isSubtree())
	            {
	            	treeWalk.enterSubtree();
	            }
	            else
	            {
	            	System.err.println("getDocList() treeWalk for:" + doc.getPath() + doc.getName() + " is not directory");
	            	walk.close();
	            	repository.close();
	            	git.close();
	            	return null;
	            }
            }
            
            //To EntrySubTree
    		String subDocParentPath = doc.getPath() + doc.getName() + "/";
    		if(doc.getDocId() == 0)
    		{
    			subDocParentPath = "";
    		}
    		int subDocLevel = doc.getLevel() + 1;
    		List <Doc> subEntryList =  new ArrayList<Doc>();
            
    		while(treeWalk.next())
        	{
        		int type = getTypeFromFileMode(treeWalk.getFileMode(0));
        		if(type > 0)
        		{
        			String name = treeWalk.getNameString();            			
            		Doc subDoc = new Doc();
            		subDoc.setVid(repos.getId());
            		subDoc.setDocId(buildDocIdByName(subDocLevel,subDocParentPath,name));
            		subDoc.setPid(doc.getDocId());
            		subDoc.setPath(subDocParentPath);
            		subDoc.setName(name);
            		subDoc.setLevel(subDocLevel);
            		subDoc.setType(type);
            		subDoc.setLatestEditTime(commitTime);
            		subDoc.setRevision(commitId);
            		subEntryList.add(subDoc);
        		}
        	}
            walk.close();
            repository.close();
            git.close();

            //由于通过treeWalk只是获取了这个Revision上的村子的文件节点（换句话说，在这个revision上存在的文件节点，并不意味着这个文件节点在这个revision上有变更）
            //由于目前的同步方案是通过文件节点的revision来确定文件是否被更新，因此必须获取文件节点真正有变更的最新revision，SVN在遍历节点时能够直接取到，
            //但GIT就目前而言需要额外去获取对应文件的最新版本
            //getTheRealLatestRevision For File
            if(subEntryList != null)
            {
            	for(int i=0; i< subEntryList.size(); i++)
            	{
            		Doc subDoc = subEntryList.get(i);
            		String subDocRevision = getLatestRevision(subDoc);
            		subDoc.setRevision(subDocRevision);
            	}
            }
            
            return subEntryList;
        } catch (Exception e) {
           System.out.println("getDocList() getTreeWalkByPath Exception"); 
           e.printStackTrace();
           return null;
        }
	}

	public List<Doc> getEntry(Doc doc, String localParentPath, String targetName,String revision, boolean force) {
		System.out.println("getEntry() parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
		//check targetName and set
		if(targetName == null)
		{
			targetName = doc.getName();
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
            if(objId == null)
            {
            	System.err.println("getEntry() There is no any commit history for repository:"   + gitDir + " at revision:" + revision);
            	walk.close();
            	repository.close();
            	git.close();
            	return null;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);
            RevTree revTree = revCommit.getTree();
    		
            List<Doc> ret = recurGetEntry(git, repository, revTree, doc, localParentPath, targetName);
            walk.close();
            repository.close();
            git.close();
            return ret;
        } catch (Exception e) {
           System.err.println("getEntry() 异常"); 
           e.printStackTrace();
           return null;
        }
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
			System.out.println("checkPath() " + entryPath +" is root");
			return 2;
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
	        	System.err.println("checkPath() there is no any history for repository:" + gitDir + " at revision:" + revision);
	        	walk.close();
	        	repository.close();
	        	git.close();
	        	return 0;
	        }
	        
	        RevCommit revCommit = walk.parseCommit(objId);
	        RevTree revTree = revCommit.getTree();
	                
	        TreeWalk treeWalk = getTreeWalkByPath(repository, revTree, entryPath);
	        int type = 0;
	        if(treeWalk != null)
	        {
	        	type = getTypeFromFileMode(treeWalk.getFileMode());
	        }
	        
	        walk.close();
	        repository.close();
	        git.close();
	        return type;
		} catch (Exception e) {
			System.err.println("checkPath() getTreeWalkByPath 异常");
			e.printStackTrace();
		}
		return null;
	}
	
	private int getTypeFromFileMode(FileMode fileMode)
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
	
	private List<Doc> recurGetEntry(Git git, Repository repository, RevTree revTree, Doc doc, String localParentPath, String targetName) {
		
		System.out.println("recurGetEntry() parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localParentPath:" + localParentPath + " targetName:" + targetName);
		
		String parentPath = doc.getPath();
		String entryName = doc.getName();
		String entryPath = doc.getPath() + doc.getName();
        
		
		TreeWalk treeWalk = null;
		try {
			treeWalk = getTreeWalkByPath(repository, revTree, entryPath);
			
			List<Doc> successDocList = new ArrayList<Doc>();
			
			int type = getTypeFromFileMode(treeWalk.getFileMode());
	        
			if(type == -1)
			{
				System.err.println("recurGetEntry() unknown type");
	        	return null;
	        }
			
			if(type == 0)
			{
				System.err.println("recurGetEntry() " + doc.getPath() + doc.getName() + " 不存在");
	        	return null;				
			}
			
			
	        if(type == 1)
	        {
	        	System.out.println("recurGetEntry() " + treeWalk.getNameString() + " isFile");

	            FileOutputStream out = null;
	    		try {
	    			out = new FileOutputStream(localParentPath + targetName);
	    		} catch (Exception e) {
	    			System.err.println("recurGetEntry() new FileOutputStream Failed:" + localParentPath + targetName);
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
	        else if(type == 2)
	        {
	        	System.out.println("recurGetEntry() " + treeWalk.getNameString() + " isDirectory");

	        	File dir = new File(localParentPath,targetName);
	        	if(!dir.exists())
				{
	        		dir.mkdir();
				}
				
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
					List<Doc> subSuccessList = recurGetEntry(git, repository, revTree, subDoc, subLocalParentPath, subEntryName);
					if(subSuccessList != null && subSuccessList.size() > 0)
					{
						successDocList.addAll(subSuccessList);
					}
				}
				return successDocList;
	        }

        }catch (Exception e) {
            System.out.println("recurGetEntry() Exception"); 
            e.printStackTrace();
            return null;
        }
		return null;
    }

	private TreeWalk getTreeWalkByPath(Repository repository, RevTree revTree, String entryPath) {
		System.out.println("getTreeWalkByPath() entryPath:" + entryPath); 

		try {
			TreeWalk treeWalk = null;
			if(entryPath.isEmpty())
	        {
	        	//Get treeWalk For whole repos
	        	treeWalk = new TreeWalk( repository );
	            treeWalk.setRecursive(false);
	            treeWalk.reset(revTree);
	        }
	        else
	        {   
	        	treeWalk = TreeWalk.forPath(repository, entryPath, revTree);
	            treeWalk.setRecursive(false);
	        }
			return treeWalk;
        }catch (Exception e) {
            System.err.println("getTreeWalkByPath() Exception"); 
            e.printStackTrace();
        }
		return null;
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
		
		List <CommitAction> commitActionList = new ArrayList<CommitAction>();
		
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
				scheduleForCommit(commitActionList, doc, localRootPath, localRefRootPath, modifyEnable, false, commitHashMap, subDocCommitFlag);
			}
		}
		
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
	    
	    String newRevision =  doCommit(git, commitUser, commitMsg, commitActionList);
	    
	    if(newRevision == null)
	    {
	    	//Do rollBack
			//Do roll back Index
			rollBackIndex(git, entryPath, null);
			rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录	
	    	return null;
	    }
	    
	    return newRevision;
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
			System.err.println("remoteCopyEntry() Exception");
			return null;
		}
		
		if (type == 0) 
		{
		    System.err.println("remoteCopyEntry() There is no entry at '" + repositoryURL + "'.");
		    return null;
		}

		String dstEntryPath = dstDoc.getPath() + dstDoc.getName();
		
		List <CommitAction> commitActionList = new ArrayList<CommitAction>();
		
	    //Do copy File Or Dir
	    if(isMove)
	    {
	    	System.out.println("svnCopy() move " + srcEntryPath + " to " + dstEntryPath);
   			insertDeleteAction(commitActionList,srcDoc);
	    }
        else
        {
 	       System.out.println("svnCopy() copy " + srcEntryPath + " to " + dstEntryPath);
 	    }
	    
		if(dstDoc.getType() == 1)
		{
			insertAddFileAction(commitActionList, dstDoc,false);
		}
		else
		{
			insertAddDirAction(commitActionList, dstDoc,false);
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
	    	if(isMove)
	    	{
	    		rollBackIndex(git, srcEntryPath, null);
	    	}
	    	
	    	rollBackIndex(git, dstEntryPath, null);
			rollBackWcDir(commitActionList);	//删除actionList中新增的文件和目录	
	    	return null;
	    }
	    
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
		
		if(isRemote)
		{
			try {
				git.push().call();
			} catch (Exception e) {
				System.out.println("doAutoCommmit() Push Error");	
				e.printStackTrace();
				//Do roll back commit
				rollBackCommit(git, null);
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
}
