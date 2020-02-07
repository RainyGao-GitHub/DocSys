package com.DocSystem.common;

import java.util.List;

import com.DocSystem.entity.Doc;

public class CommitAction{
	public enum CommitType {
		UNDEFINED,
		ADD,
		DELETE,
		MODIFY,
		MOVE,
		COPY,
		FILETODIR,
		DIRTOFILE;
	}
	
    private CommitType action; //1:add 2:delete 3:modify 4:move 5:copy
    
    private Doc doc;
    private Doc newDoc;

    private String localRootPath;
    private String localRefRootPath;
    
    //Sub Action List
    public boolean isSubAction = false;
    private List<CommitAction> subActionList = null;
	
    //result: execute result
    public boolean result = true;
    
	public void setAction(CommitType commitActionType) {
		this.action = commitActionType;
	}
	
	public CommitType getAction()
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
	
	public void setSubActionList(List<CommitAction> subActionList) {
		this.subActionList = subActionList;
	}
	
	public List<CommitAction> getSubActionList()
	{
		return subActionList;
	}
	
	public void setResult(boolean result) {
		this.result = result;
	}
	public boolean getResult()
	{
		return result;
	}
}