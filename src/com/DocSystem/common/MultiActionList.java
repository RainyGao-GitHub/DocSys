package com.DocSystem.common;

import java.util.ArrayList;
import java.util.List;

public class MultiActionList{
    private List<CommonAction> dbActionList = null;
    private List<CommonAction> indexActionList = null;
    private List<CommonAction> localActionList = null;
    private List<CommonAction> commitActionList = null;

    public MultiActionList()
    {
    	dbActionList = new ArrayList<CommonAction>();
    	indexActionList = new ArrayList<CommonAction>();
    	localActionList = new ArrayList<CommonAction>();
    	commitActionList = new ArrayList<CommonAction>();
    }
    
	public void setIndexActionList(List<CommonAction> indexActionList) {
		this.indexActionList = indexActionList;
	}
	
	public List<CommonAction> getIndexActionList()
	{
		return indexActionList;
	}
	
	public void setLocalActionList(List<CommonAction> localActionList) {
		this.localActionList = localActionList;
	}
	
	public List<CommonAction> getLocalActionList()
	{
		return localActionList;
	}
	
	public void setCommitActionList(List<CommonAction> commitActionList) {
		this.commitActionList = commitActionList;
	}
	
	public List<CommonAction> getCommitActionList()
	{
		return commitActionList;
	}
	
	public void setDBActionList(List<CommonAction> dbActionList) {
		this.dbActionList = dbActionList;
	}
	
	public List<CommonAction> getDBActionList()
	{
		return dbActionList;
	}
	
}
