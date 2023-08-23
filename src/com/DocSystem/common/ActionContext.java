package com.DocSystem.common;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

public class ActionContext {

	public String requestIP;

	public User user;

	public String event;
	public String eventName;
	public String subEvent;
	
	public String queryId;	//queryId for this task
		
	public Repos repos;
	public Doc doc;
	public Doc newDoc;
	public Integer docLockType;
	public Integer newDocLockType;
	public String info;	//用于lockDoc的备注
	
	//用于目录上传
	public FolderUploadAction folderUploadAction;

	//MxsDoc系统的commitId
	
	public Long commitId;
	public String commitMsg;
	public String commitUser;
	public Long startTime;
	public Long endTime;
}
