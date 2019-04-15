package com.DocSystem.common;

import java.util.ArrayList;
import java.util.List;

public class MultiActionList{
    private List<DBAction> dbActionList = null;
    private List<IndexAction> indexActionList = null;
    private List<LocalAction> localActionList = null;
    private List<CommitAction> commitActionList = null;

    public MultiActionList()
    {
    	dbActionList = new ArrayList<DBAction>();
    	indexActionList = new ArrayList<IndexAction>();
    	localActionList = new ArrayList<LocalAction>();
    	commitActionList = new ArrayList<CommitAction>();
    }
    
	public void setIndexActionList(List<IndexAction> indexActionList) {
		this.indexActionList = indexActionList;
	}
	
	public List<IndexAction> getIndexActionList()
	{
		return indexActionList;
	}
	
	public void setLocalActionList(List<LocalAction> localActionList) {
		this.localActionList = localActionList;
	}
	
	public List<LocalAction> getLocalActionList()
	{
		return localActionList;
	}
	
	public void setCommitActionList(List<CommitAction> commitActionList) {
		this.commitActionList = commitActionList;
	}
	
	public List<CommitAction> getCommitActionList()
	{
		return commitActionList;
	}
	
	public void setDBActionList(List<DBAction> dbActionList) {
		this.dbActionList = dbActionList;
	}
	
	public List<DBAction> getDBActionList()
	{
		return dbActionList;
	}
	
}
