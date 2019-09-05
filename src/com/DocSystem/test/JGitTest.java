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

    	//Set ReposInfo
    	Repos repos = new Repos();
    	repos.setRealDocPath("C:/JGitTestDir/LocalDir/");
    	repos.setVerCtrl(2);
    	repos.setIsRemote(0);
		repos.setLocalSvnPath("C:/JGitTestDir/GitRepos/");
    	repos.setId(123456);
    	
    	//Create LocalDir
    	File localDir = new File(repos.getRealDocPath());
    	if(!localDir.exists())
    	{
    		localDir.mkdirs();
    	}
    	
    	//Create Git Repos
    	GITUtil gitUtil = new GITUtil();
    	gitUtil.Init(repos, isRealDoc, "");
    	String gitPath = gitUtil.CreateRepos();
    	System.out.println("gitPath:" + gitPath);
    	if(gitPath == null)
    	{
    		System.out.println("createGitLocalRepos Failed!");
    		return;
    	}
    	
    	//Auto Commit to Git Repos
    	Doc doc = new Doc();
    	doc.setDocId(0L);
    	doc.setLevel(0);
    	doc.setPath("");
    	doc.setName("");
    	doc.setLocalRootPath(repos.getRealDocPath());
		if(null == gitUtil.doAutoCommit(doc, "Init GitRepos", "RainyGao",true,null,2))
		{
    		System.out.println("gitAutoCommit Failed!");
    		return;
		}
		
		//Go Through the verRepos Tree
		String gitDir = "C:/JGitTestDir/GitRepos/123456_GIT_RRepos/.git/";
		//ReposTreeWalk("","",gitDir, null); // "9e0b3958c65b661b01380af021c699253941ac87");
		
		//GetEntry From verRepos
		ReposTreeWalk("","UnstableCase",gitDir, null); // "9e0b3958c65b661b01380af021c699253941ac87")
    }
    
    
    
    @SuppressWarnings("resource")
	public static boolean ReposTreeWalk(String parentPath, String entryName, String gitDir,String revision) {
    	System.out.println("ReposTreeWalk() revision:" + revision);
    	
        if(revision == null || revision.isEmpty())
        {
        	revision = "HEAD";
        }
    	
    	Repository repository = null;
        try {
            //gitDir表示git库目录
        	Git git = Git.open(new File(gitDir));
            repository = git.getRepository();
            
            //Get RevWalk
            RevWalk walk = new RevWalk(repository);

            //Get objId for revision
            ObjectId objId = repository.resolve(revision);
            if(objId == null)
            {
            	System.out.println("There is no any commit history");
            	return false;
            }
            
            RevCommit revCommit = walk.parseCommit(objId);
            System.out.println("revCommit name:" + revCommit.getName());
            System.out.println("revCommit type:" + revCommit.getType());
            System.out.println("revCommit commitMsg:" + revCommit.getShortMessage());
    		
            RevTree revTree = revCommit.getTree();
            System.out.println("revTree name:" + revTree.getName());
            System.out.println("revTree id:" + revTree.getId());
            
        	TreeWalk tw = new TreeWalk(repository,  repository.newObjectReader());
        	//PathFilter f = PathFilter.create(entryPath);
        	//tw.setFilter(f);
        	tw.reset(revTree);
        	tw.setRecursive(false);
        	
        	//Find out the 
        	while (tw.next()) 
        	{
        		System.out.println("path:" + tw.getPathString());
        		if (tw.isSubtree()) 
        		{
        			tw.enterSubtree();
        		}
        	}

            repository.close();
            return true;
        } catch (Exception e) {
           System.out.println("ReposTreeWalk() Exception"); 
           e.printStackTrace();
           return false;
        }
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
} 