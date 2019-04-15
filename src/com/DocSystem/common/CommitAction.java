package com.DocSystem.common;

import java.util.List;

public class CommitAction{
    private Integer action; //1:add 2:delete 3:modify 4:move 5:copy
    
    private Integer entryType;
    
    private String parentPath;
    private String entryName;
    private String newParentPath;
    private String newEntryName;

    private String localRootPath;
    private String localRefRootPath;
    
    //subAction
    public boolean isSubAction = false;
    //Sub Action List
    public boolean hasSubList = false;
    private List<CommitAction> subActionList = null;
	
	public void setAction(Integer action) {
		this.action = action;
	}
	
	public Integer getAction()
	{
		return action;
	}
	
	public void setEntryType(Integer entryType) {
		this.entryType = entryType;
	}
	
	public Integer getEntryType()
	{
		return entryType;
	}


	public void setParentPath(String parentPath) {
		this.parentPath = parentPath;
	}
	
	public String getParentPath()
	{
		return parentPath;
	}

	public void setEntryName(String entryName) {
		this.entryName = entryName;
	}
	
	public String getEntryName()
	{
		return entryName;
	}

	public void setNewParentPath(String newParentPath) {
		this.newParentPath = newParentPath;
	}
	
	public String getNewParentPath()
	{
		return newParentPath;
	}

	public void setNewEntryName(String newEntryName) {
		this.newEntryName = newEntryName;
	}
	
	public String getNewEntryName()
	{
		return newEntryName;
	}

	public void setLocalRefRootPath(String localRefRootPath) {
		this.localRefRootPath = localRefRootPath;
	}
	
	public String getLocalRefRootPath()
	{
		return localRefRootPath;
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
	
	public void setSubActionList(List<CommitAction> subActionList) {
		this.subActionList = subActionList;
	}
	
	public List<CommitAction> getSubActionList()
	{
		return subActionList;
	}
	
}