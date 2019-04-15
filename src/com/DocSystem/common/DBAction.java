package com.DocSystem.common;

import com.DocSystem.entity.Doc;

public class DBAction{
    private Integer action;	//1:add 2:delete 3:update 4:move 5:copy
    private Doc doc = null;
    private Doc newDoc = null;	//This is for move/copy

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
}
