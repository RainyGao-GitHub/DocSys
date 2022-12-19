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
	
	//TODO: 主要用于目录上传
	public boolean isSubAction = false;
	public String actionId = null; //用于标记同一次上传，前端会告知（一般用startTime作为actionId）
}
