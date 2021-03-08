package com.DocSystem.common.CommonAction;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

public class CommonAction {
    private ActionType type = null; 	//1:FS 2:VerRepos 3:DB 4:Index  5:AutoSyncUp
	private Action action = null;	//1:add 2:delete 3:update 4:move 5:copy
    private DocType docType = null; //0:DocName 1:RealDoc 2:VirtualDoc

    private Repos repos = null;
    private Doc doc = null;
    private Doc newDoc = null;	//This is for move/copy
    
    //For commitAction
    private String commitMsg = null;
    private String commitUser = null;    
    
    private User user = null;    
    
    //For localAction
	MultipartFile uploadFile = null;
	private String chunkParentPath = null;
	private Long chunkSize = null;
	private Integer chunkNum = null;
	
    //For subAction
    public boolean isSubAction = false;
    public boolean hasSubList = false;
    private List<CommonAction> subActionList = null;	//subActionList when action success
	private List<CommonAction> subActionListForFail = null;	//subActionList when action failed 
    
	public void setAction(Action action) {
		this.action = action;
	}
	
	public Action getAction()
	{
		return action;
	}
	
	public void setType(ActionType type) {
		this.type = type;
	}
	
	public ActionType getType()
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
	
	public void setDocType(DocType docType) {
		this.docType = docType;
	}
	
	public DocType getDocType()
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

	//For commitAction
	public void setCommitMsg(String commitMsg) {
		this.commitMsg = commitMsg;
	}

	public String getCommitMsg()
	{
		return commitMsg;
	}
	
	public void setUser(User user) {
		this.user = user;	
	}
	
	public User getUser()
	{
		return user;
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
	
	public Long getChunkSize() {
		return chunkSize;
	}
	
	public void setChunkSize(Long chunkSize) {
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
	
	/******************************** Basic Interface for CommonAction *************************************/
	//CommonAction 主要用于异步行为
    //ActionId 1:FS 2:VerRepos 3:DB 4:Index  5:AutoSyncUp
	//ActionType 1:add 2:delete 3:update 4:move 5:copy
    //DocType 0:DocName 1:RealDoc 2:VirtualDoc   AutoSyncUp(1: localDocChanged  2: remoteDocChanged)
	public static void insertCommonAction(List<CommonAction> actionList, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg,String commitUser, ActionType actionId, Action actionType, DocType docType, List<CommonAction> subActionList, User user) 
	{	
		CommonAction action = new CommonAction();
		action.setType(actionId);		
		action.setAction(actionType);
		action.setDocType(docType);

		//System.out.println("insertCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());
		
		action.setRepos(repos);
		action.setDoc(srcDoc);
		action.setNewDoc(dstDoc);
		
		action.setUser(user);
		action.setCommitMsg(commitMsg);
		action.setCommitUser(commitUser);
		
		action.setSubActionList(subActionList);
		
		actionList.add(action);
	}
}
