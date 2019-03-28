package com.DocSystem.test;
import java.io.File;
import java.io.FileOutputStream;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.TreeWalk;

class JGitTest  
{  
	static String gitDir = "C:\\DocSysReposes\\DocSysVerReposes\\17_GIT_RRepos";
	
    public static void main(String[] args) throws Exception {
    	Git git = Git.open(new File(gitDir));
    	Repository repository = git.getRepository();
    	
    	getEntry("","","C:\\GitTestDir\\","Repos",null);
    }
    
    
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

	private static boolean isFile(FileMode fileMode)
	{
		return (fileMode.getBits() & FileMode.TYPE_MASK) == FileMode.TYPE_FILE? true: false;
	}
	
	private static boolean isDir(FileMode fileMode)
	{
		return (fileMode.getBits() & FileMode.TYPE_MASK) == FileMode.TYPE_TREE? true: false;
	}
	
	private boolean isMissing(FileMode fileMode)
	{
		return (fileMode.getBits() & FileMode.TYPE_MASK) == FileMode.TYPE_MISSING? true: false;
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
}  