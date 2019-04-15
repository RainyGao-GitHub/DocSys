package com.DocSystem.common;

import java.util.List;

import com.DocSystem.entity.Doc;

public class LocalAction{
    private Integer action;	//1:add 2:delete 3:update 4:move 5:copy
    private Doc doc = null;
    private Doc newDoc = null;	//This is for move/copy
    
    private String localRootPath;
    
    //subAction
    public boolean isSubAction = false;
    //Sub Action List
    public boolean hasSubList = false;
    private List<LocalAction> subActionList = null;
	
	public void setAction(Integer action) {
		this.action = action;
	}
	
	public Integer getAction()
	{
		return action;
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
	
	public boolean getHasSubList()
	{
		return hasSubList;
	}
	
	public void setHasSubList(boolean hasSubList) {
		this.hasSubList = hasSubList;
	}
	
	public void setSubActionList(List<LocalAction> subActionList) {
		this.subActionList = subActionList;
	}
	
	public List<LocalAction> getSubActionList()
	{
		return subActionList;
	}
	
}
