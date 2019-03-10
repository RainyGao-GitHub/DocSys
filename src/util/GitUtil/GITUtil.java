package util.GitUtil;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.eclipse.jgit.api.CommitCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoFilepatternException;
import org.eclipse.jgit.lib.Repository;

import com.DocSystem.controller.BaseController;
import com.DocSystem.entity.Repos;

public class GITUtil  extends BaseController{
    //For Low Level APIs
	private Repository repository = null;
	private Git git = null;
	private String repositoryURL = null;
	
	public boolean Init(Repos repos,boolean isRealDoc, String commitUser) {
    	String reposURL = null;
    	String user = null;
    	String pwd = null;
    
    	Integer isRemote = null;
    	if(isRealDoc)
    	{
    		isRemote = repos.getIsRemote();
    		if(isRemote == 1)
    		{
    			reposURL = repos.getSvnPath();
    			user = repos.getSvnUser();
    			pwd = repos.getSvnPwd();
    		}
    		else
    		{
    			reposURL = getLocalVerReposPath(repos,isRealDoc);
    		}
    	}
    	else
    	{
    		isRemote = repos.getIsRemote1();
    		if(isRemote == 1)
    		{
    			reposURL = repos.getSvnPath1();
    			user = repos.getSvnUser1();
    			pwd = repos.getSvnPwd1();
    		}
    		else
    		{
    			reposURL = getLocalVerReposPath(repos,isRealDoc);
    		}
    	}

		//Set user to commitUser if user is null
		if(user==null || "".equals(user))
		{
			user = commitUser;
		}
		
		repositoryURL = reposURL;
		repository = null;
		
		try {
			git = Git.open(new File(repositoryURL));
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		};
	
		return true;
	}
	
    //新建本地git仓库
	public static String CreateRepos(String name,String path){
		System.out.println("CreateRepos reposName:" + name + "under Path:" + path);
		
		File dir = new File(path,name);
        try {
			Git.init().setGitDir(dir).setDirectory(dir.getParentFile()).call();
		} catch (Exception e) {
			e.printStackTrace();
			System.out.println("CreateRepos error");
			return null;
		}
        
        return path+name;
	}
	
	//Commit all changes under dedicated directory
	public boolean doAutoCommit(String parentPath, String entryName,String localPath,String commitMsg,String commitUser,boolean modifyEnable,String localRefPath){
		System.out.println("doAutoCommit()" + " parentPath:" + parentPath +" entryName:" + entryName +" localPath:" + localPath + " commitMsg:" + commitMsg +" modifyEnable:" + modifyEnable + " localRefPath:" + localRefPath);	
	
		String entryPath = parentPath + entryName;
		try {	
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
}
