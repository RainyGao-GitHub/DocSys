package com.DocSystem.test;

import java.io.File;

import org.eclipse.jgit.api.Git;
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

import com.DocSystem.controller.ReposController;
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
    	
//    	//Auto Commit to Git Repos
//		if(false == gitUtil.doAutoCommit("", "", repos.getRealDocPath(), "Init GitRepos", "RainyGao",true,null))
//		{
//    		System.out.println("gitAutoCommit Failed!");
//    		return;
//		}
		
		//Go Through the verRepos Tree
		String gitDir = "C:/JGitTestDir/GitRepos/123456_GIT_RRepos/.git/";
		ReposTreeWalk("","",gitDir, null); // "9e0b3958c65b661b01380af021c699253941ac87");
		
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
            
            //New RevWalk
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
            System.out.println("revCommit type:" + revCommit.getShortMessage());
    		
            RevTree revTree = revCommit.getTree();
            System.out.println("revTree name:" + revTree.getName());
            System.out.println("revTree id:" + revTree.getId());            
    		
            //ObjectLoader loader = repository.open(revTree.getId());
            //loader.copyTo(System.out);
            
            //Get treeWalk For whole repos
            TreeWalk treeWalk = new TreeWalk( repository );
            //treeWalk.setRecursive(true);
            treeWalk.reset(revTree);
            int count = 0;
            while(treeWalk.next()) 
            {
            	count++;
            	System.out.println("************ Entry count:" + count);
               	System.out.println("path:" + treeWalk.getPathString());
               	System.out.println("name:" + treeWalk.getNameString());
            	//System.out.println("treeCount:" + treeWalk.getTreeCount());
            	//System.out.println("depth:" + treeWalk.getDepth());
            	//System.out.println("PathLength:" + treeWalk.getPathLength());
               	System.out.println("isSubtree:" + treeWalk.isSubtree());
               	System.out.println("fileMode:" + treeWalk.getFileMode(0));
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

/*
    public static boolean getEntry(String parentPath, String entryName, String localParentPath, String targetName,String revision) {
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
            	//Get treeWalk For dedicated Entry
            	treeWalk = TreeWalk.forPath(repository, remoteEntryPath, revTree);
            }
            
            while( treeWalk.next() ) {

            	//System.out.println("path:" + treeWalk.getPathString());
               	System.out.println("name:" + treeWalk.getNameString());
            	System.out.println("treeCount:" + treeWalk.getTreeCount());
            	System.out.println("depth:" + treeWalk.getDepth());
            	System.out.println("PathLength:" + treeWalk.getPathLength());
               	System.out.println("isSubtree:" + treeWalk.isSubtree());
               	System.out.println("fileMode:" + treeWalk.getFileMode(0));
      		}
            
            //boolean ret = recurGetEntry(git, repository, treeWalk, parentPath, entryName, localParentPath, targetName);
            repository.close();
            return true;
        } catch (Exception e) {
           System.out.println("getEntry() Exception"); 
           e.printStackTrace();
           return false;
        }
    }
private static boolean recurGetEntry(Git git, Repository repository, TreeWalk treeWalk, String parentPath, String entryName, String localParentPath, String targetName) {
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
			
   		    treeWalk.enterSubtree();
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
*/