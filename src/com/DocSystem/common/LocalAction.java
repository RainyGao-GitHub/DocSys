package com.DocSystem.common;

import java.util.List;

public class LocalAction{
    private Integer action;	//1:add 2:delete 3:update 4:move 5:copy
    private String parentPath;
    private String docName;
    private String newParentPath;	//This is for rename/move
    private String newDocName;		//This is for rename/move
    private String content;			//Content for Local Add or Update
    
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
		
	public void setParentPath(String parentPath) {
		this.parentPath = parentPath;
	}
	
	public String getParentPath()
	{
		return parentPath;
	}

	public void setDocName(String docName) {
		this.docName = docName;
	}
	
	public String getDocName()
	{
		return docName;
	}
	
	public void setNewParentPath(String newParentPath) {
		this.newParentPath = newParentPath;
	}
	
	public String getNewParentPath()
	{
		return newParentPath;
	}

	public void setNewDocName(String newDocName) {
		this.newDocName = newDocName;
	}
	
	public String getNewDocName()
	{
		return newDocName;
	}
	
	public void setContent(String content) {
		this.content = content;
	}
	
	public String getContent()
	{
		return content;
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
