package com.DocSystem.common;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

public class DocChange {	
	public enum DocChangeType {
		UNDEFINED,
		LOCALADD,
		LOCALDELETE,
		LOCALCHANGE,
		LOCALFILETODIR,
		LOCALDIRTOFILE,
		REMOTEADD,
		REMOTEDELETE,
		REMOTECHANGE,
		REMOTEFILETODIR,
		REMOTEDIRTOFILE,
		NOCHANGE;
	}
	
	private DocChangeType type = DocChangeType.UNDEFINED;
	
	private Repos repos = null;
    private Doc doc = null;
    private Doc dbDoc = null;
    private Doc localEntry = null;
    private Doc remoteEntry = null;

    //For commitAction
    private String commitMsg = null;
    private String commitUser = null;    
    
    private User user = null;    
	    
	public void setType(DocChangeType type) {
		this.type = type;
	}
	
	public DocChangeType getType()
	{
		return type;
	}

	public void setRepos(Repos repos) {
		this.repos = repos;
	}
	
	public Repos getRepos()
	{
		return repos;
	}
	
	public void setDoc(Doc doc) {
		this.doc = doc;
	}
	
	public Doc getDoc()
	{
		return doc;
	}
	
	public void setDbDoc(Doc dbDoc) {
		this.dbDoc = dbDoc;
	}
	
	public Doc getDbDoc()
	{
		return dbDoc;
	}
	
	public void setLocalEntry(Doc localEntry) {
		this.localEntry = localEntry;
	}
	
	public Doc getLocalEntry()
	{
		return localEntry;
	}
	
	public void setRemoteEntry(Doc remoteEntry) {
		this.remoteEntry = remoteEntry;
	}
	
	public Doc getRemoteEntry()
	{
		return remoteEntry;
	}

	//For commitAction
	public void setCommitMsg(String commitMsg) {
		this.commitMsg = commitMsg;
	}

	public String getCommitMsg()
	{
		return commitMsg;
	}
	
	public void setUser(User user) {
		this.user = user;	
	}
	
	public User getUser()
	{
		return user;
	}
	
	public void setCommitUser(String commitUser) {
		this.commitUser = commitUser;	
	}
	
	public String getCommitUser()
	{
		return commitUser;
	}
}
