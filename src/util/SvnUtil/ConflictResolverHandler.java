package util.SvnUtil;

import java.util.Scanner;

import org.tmatesoft.svn.core.SVNException;
import org.tmatesoft.svn.core.wc.ISVNConflictHandler;
import org.tmatesoft.svn.core.wc.SVNConflictChoice;
import org.tmatesoft.svn.core.wc.SVNConflictDescription;
import org.tmatesoft.svn.core.wc.SVNConflictReason;
import org.tmatesoft.svn.core.wc.SVNConflictResult;
import org.tmatesoft.svn.core.wc.SVNMergeFileSet;

public class ConflictResolverHandler implements ISVNConflictHandler {  
  
    /*  
     * (non-Javadoc)  
     *   
     * @see  
     * org.tmatesoft.svn.core.wc.ISVNConflictHandler#handleConflict(org.tmatesoft  
     * .svn.core.wc.SVNConflictDescription)  
     */  
    @Override  
    public SVNConflictResult handleConflict( SVNConflictDescription conflictDescription) throws SVNException {  
  
        SVNConflictReason reason = conflictDescription.getConflictReason();  
        SVNMergeFileSet mergeFiles = conflictDescription.getMergeFiles();  
  
        System.out.println("Conflict discovered in:" + mergeFiles.getWCFile());  
        System.out.println(reason);  
        
        SVNConflictChoice choice = SVNConflictChoice.POSTPONE;  
        choice = SVNConflictChoice.MINE_FULL; //get the local working copy file 
        //choice = SVNConflictChoice.THEIRS_FULL; //get the remote file 
        
        return new SVNConflictResult(choice, mergeFiles.getResultFile());  
  
    }  
}  