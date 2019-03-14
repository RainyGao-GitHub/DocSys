package util.GitUtil;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.CommitCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.SVNLogEntry;
import org.tmatesoft.svn.core.SVNLogEntryPath;

import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.ChangedItem;
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
	
	//Commit all changes under dedicated directory
	public boolean doAutoCommit(String parentPath, String entryName,String localPath,String commitMsg,String commitUser,boolean modifyEnable,String localRefPath){
		System.out.println("doAutoCommit()" + " parentPath:" + parentPath +" entryName:" + entryName +" localPath:" + localPath + " commitMsg:" + commitMsg +" modifyEnable:" + modifyEnable + " localRefPath:" + localRefPath);	
	
		String entryPath = parentPath + entryName;
		try {
			Git git = Git.open(new File(repositoryURL));
			
			if(entryPath == null || entryPath.isEmpty())
			{
				git.add().addFilepattern(".").call();
			}
			else
			{		
				//Git did not support emptry dir, so need do preHandle
				git.add().addFilepattern(entryPath).call(); // 添加目录或者指定文件
			}
			
			//Do commit
			CommitCommand commitCommand = git.commit().setCommitter(commitUser,null).setMessage(commitMsg).setAllowEmpty(true);
			commitCommand.call();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public boolean Commit(String parentPath, String entryName) {
		// TODO Auto-generated method stub
		System.out.println("Commit");	

        Git git = null;
		try {
			git = Git.open(new File(wcDir));
	        git.add().addFilepattern(parentPath+entryName).call();
	        git.commit().setMessage("addFile").call();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			System.out.println("Commit Error");	
			e.printStackTrace();
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
			}
		}
		
        return true;
	}
	
    //getHistory filePath: remote File Path under repositoryURL
    public List<LogEntry> getHistoryLogs(String filePath,long startRevision, long endRevision,int maxLogNum) 
    {
    	System.out.println("getHistoryLogs filePath:" + filePath);	

    	Git git = null;
		try {
	    	List<LogEntry> logList = new ArrayList<LogEntry>();
			
	    	git = Git.open(new File(wcDir));
		    Iterable<RevCommit> iterable=git.log().addPath(filePath).setMaxCount(maxLogNum).call();
	        
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
}
