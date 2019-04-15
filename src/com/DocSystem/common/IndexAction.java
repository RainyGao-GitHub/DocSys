package com.DocSystem.common;

import java.util.List;

public class IndexAction{
    private Integer action;	//1:add 2:delete 3:update 4:move 5:copy
    
    private Integer indexType; //0:DocName 1:RealDoc 2:VirtualDoc
    private String content;	//If content was set, then content will not get according to indexType
    
    private Integer reposId;
    private Integer docId;
    private String parentPath;
    private String docName;
    private Integer size;
    private String checkSum;
    private Long createdTime;
    private String createdBy;
    private Long lastModifiedTime;
    private String lastModifiedBy;
    
    private String newParentPath;	//This is for rename/move/copy
    private String newDocName;		//This is for rename/move/copy
    private String localRootPath;
    private String indexLib;
    
    //subAction
    public boolean isSubAction = false;
    //Sub Action List
    public boolean hasSubList = false;
    private List<IndexAction> subActionList = null;
	
	public void setAction(Integer action) {
		this.action = action;
	}
	
	public Integer getAction()
	{
		return action;
	}
	
	public void setReposId(Integer reposId) {
		this.reposId = reposId;
	}
	
	public Integer getReposId()
	{
		return reposId;
	}
	
	public void setDocId(Integer docId) {
		this.docId = docId;
	}
	
	public Integer getDocId()
	{
		return docId;
	}
	
	public void setIndexType(Integer indexType) {
		this.indexType = indexType;
	}
	
	public Integer getIndexType()
	{
		return indexType;
	}
	
	public void setContent(String content) {
		this.content = content;
	}
	
	public String getContent()
	{
		return content;
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
	
	public void setSubActionList(List<IndexAction> subActionList) {
		this.subActionList = subActionList;
	}
	
	public List<IndexAction> getSubActionList()
	{
		return subActionList;
	}
	
}
