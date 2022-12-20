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
		
	public Repos repos;
	public Doc doc;
	public Doc newDoc;
	public Integer docLockType;
	public Integer newDocLockType;
	
	//用于目录上传
	public FolderUploadAction folderUploadAction;
}
