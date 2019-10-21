package com.DocSystem.test;

import java.io.File;
import java.io.IOException;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.errors.CorruptObjectException;
import org.eclipse.jgit.errors.IncorrectObjectTypeException;
import org.eclipse.jgit.errors.MissingObjectException;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.PathFilter;

import com.DocSystem.controller.ReposController;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

import util.ReturnAjax;
import util.GitUtil.GITUtil;

class JGitTest extends ReposController{  
	
    public static void main(String[] args) throws Exception {
		ReturnAjax rt = new ReturnAjax();
		boolean isRealDoc = true;

    	//Origin Repos
    	Repos repos = new Repos();
    	repos.setRealDocPath("C:/JGitTestDir/OriginDir/");
    	repos.setVerCtrl(2);
    	repos.setIsRemote(0);
		repos.setLocalSvnPath("C:/JGitTestDir/OriginGitRepos/");
    	repos.setId(123456);

    	//Local Repos
    	Repos localRepos = new Repos();
    	localRepos.setRealDocPath("C:/JGitTestDir/LocalDir/");
    	localRepos.setVerCtrl(2);
    	localRepos.setIsRemote(1);
    	localRepos.setLocalSvnPath("C:/JGitTestDir/LocalGitRepos/");
    	localRepos.setSvnPath("C:/JGitTestDir/OriginGitRepos/123456_GIT_RRepos");
    	localRepos.setId(234567);
    	localRepos.setSvnUser(null);
    	
    	//Create realDocPath
    	File originDocRootDir = new File(repos.getRealDocPath());
    	if(!originDocRootDir.exists())
    	{
    		originDocRootDir.mkdirs();
    	}
    	File localDocRootDir = new File(localRepos.getRealDocPath());
    	if(!localDocRootDir.exists())
    	{
    		localDocRootDir.mkdirs();
    	}
    	
    	//Create Git Repos
    	GITUtil originGitUtil = new GITUtil();
    	originGitUtil.Init(repos, isRealDoc, "");
    	String originGitPath = originGitUtil.CreateRepos();
    	System.out.println("originGitPath:" + originGitPath);
    	if(originGitPath == null)
    	{
    		System.out.println("createGitLocalRepos Failed!");
    		return;
    	}
    	
    	//Clone
		GITUtil localGitUtil = new GITUtil();
		localGitUtil.deleteClonedRepos(localRepos, isRealDoc);
		localGitUtil.Init(localRepos, isRealDoc, "");
		localGitUtil.CloneRepos();
        
    	//Auto Commit to Origin Git Repos at root dir
    	Doc doc = new Doc();
    	doc.setDocId(0L);
    	doc.setLevel(0);
    	doc.setPath("");
    	doc.setName("");
    	doc.setLocalRootPath(repos.getRealDocPath());
		if(null == originGitUtil.doAutoCommit(doc, "Init OriginGitRepos", "OriginRainyGao",true,null,2))
		{
    		System.out.println("gitAutoCommit Failed!");
    		return;
		}
		
    	//Auto Commit to Local Git Repos at root dir
    	doc.setLocalRootPath(localRepos.getRealDocPath());
		if(null == localGitUtil.doAutoCommit(doc, "Init LocalGitRepos", "LocalRainyGao",true,null,2))
		{
    		System.out.println("gitAutoCommit Failed!");
    		return;
		}
		
		//Do rebase 
		if(localGitUtil.doPullEx() == false)
		{
    		System.out.println("gitAutoCommit doPullEx Failed!");
    		return;			
		}
		
		//Do push
		if(localGitUtil.doPushEx() == false)
		{
    		System.out.println("gitAutoCommit doPush Failed!");
    		return;		
		}
    }
} 