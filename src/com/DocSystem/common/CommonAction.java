package com.DocSystem.common;

import java.util.List;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

public class CommonAction {
    private Integer action;	//1:add 2:delete 3:update 4:move 5:copy
 
    private Integer type; //0:DocName 1:RealDoc 2:VirtualDoc
    
    private Repos repos = null;
    private Doc doc = null;
    private Doc newDoc = null;	//This is for move/copy
    
    private String localRootPath;
    private String indexLib;
    
    //subAction
    public boolean isSubAction = false;
    //Sub Action List
    public boolean hasSubList = false;
    private List<CommonAction> subActionList = null;
	
	public void setAction(Integer action) {
		this.action = action;
	}
	
	public Integer getAction()
	{
		return action;
	}
	
	public void setType(Integer type) {
		this.type = type;
	}
	
	public Integer getIndexType()
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
	
	public void setNewDoc(Doc newDoc) {
		this.newDoc = newDoc;
	}
	
	public Doc getNewDoc()
	{
		return newDoc;
	}

	public void setLocalRootPath(String localRootPath) {
		this.localRootPath = localRootPath;
	}
	
	public String getLocalRootPath()
	{
		return localRootPath;
	}

	public void setIndexLib(String indexLib) {
		this.indexLib = indexLib;
	}
	
	public String getIndexLib()
	{
		return indexLib;
	}
	
	public boolean getHasSubList()
	{
		return hasSubList;
	}
	
	public void setHasSubList(boolean hasSubList) {
		this.hasSubList = hasSubList;
	}
	
	public void setSubActionList(List<CommonAction> subActionList) {
		this.subActionList = subActionList;
	}
	
	public List<CommonAction> getSubActionList()
	{
		return subActionList;
	}
	
}
