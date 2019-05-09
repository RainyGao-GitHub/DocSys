package com.DocSystem.common;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;

public class CommonAction {
    private Integer type = null; 	//1:FS 2:VerRepos 3:DB 4:Index  5:AutoSyncUp
	private Integer action = null;	//1:add 2:delete 3:update 4:move 5:copy
    private Repos repos = null;
    private Integer docType = null; //0:DocName 1:RealDoc 2:VirtualDoc   AutoSyncUp(1: localDocChanged  2: remoteDocChanged)
    private Doc doc = null;
    private Doc newDoc = null;	//This is for move/copy
    private String localRootPath = null;
    
    //For commitAction
    private String commitMsg = null;
    private String commitUser = null;    
    
    //For localAction
	MultipartFile uploadFile = null;
	private String chunkParentPath = null;
	private Integer chunkSize = null;
	private Integer chunkNum = null;
	
    //For subAction
    public boolean isSubAction = false;
    public boolean hasSubList = false;
    private List<CommonAction> subActionList = null;	//subActionList when action success
	private List<CommonAction> subActionListForFail = null;	//subActionList when action failed 
    
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
	
	public Integer getType()
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
	
	public void setDocType(Integer docType) {
		this.docType = docType;
	}
	
	public Integer getDocType()
	{
		return docType;
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

	//For commitAction
	public void setCommitMsg(String commitMsg) {
		this.commitMsg = commitMsg;
	}

	public String getCommitMsg()
	{
		return commitMsg;
	}
	
	public void setCommitUser(String commitUser) {
		this.commitUser = commitUser;	
	}
	
	public String getCommitUser()
	{
		return commitUser;
	}
	
	//For LocalAction
	public MultipartFile getUploadFile() {
		return uploadFile;
	}
	
	public void setUploadFile(MultipartFile uploadFile) {
		this.uploadFile = uploadFile;	
	}

	public Integer getChunkNum() {
		return chunkNum;
	}

	public void setChunkNum(Integer chunkNum) {
		this.chunkNum = chunkNum;	
	}
	
	public Integer getChunkSize() {
		return chunkSize;
	}
	
	public void setChunkSize(Integer chunkSize) {
		this.chunkSize = chunkSize;	
	}

	public String getChunkParentPath() {
		return chunkParentPath;
	}
	
	public void setChunkParentPath(String chunkParentPath) {
		this.chunkParentPath = chunkParentPath;	
	}
	
	//For SubAction
	//For SubAction
	public boolean getIsSubAction()
	{
		return isSubAction;
	}
	
	public void setIsSubAction(boolean isSubAction) {
		this.isSubAction = isSubAction;
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
	
	public void setSubActionListForFail(List<CommonAction> subActionListForFail) {
		this.subActionListForFail = subActionListForFail;
	}
	
	public List<CommonAction> getSubActionListForFail()
	{
		return subActionListForFail;
	}
}
