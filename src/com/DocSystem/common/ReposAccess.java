package com.DocSystem.common;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocShare;
import com.DocSystem.entity.User;

public class ReposAccess {
	private Integer accessUserId = null; //
	private User accessUser = null; //
	private DocAuth authMask = null;	//
	private DocShare docShare = null;	//
	private String rootDocPath = "";
	private String rootDocName = "";
	
	public Integer getAccessUserId()
	{
		return accessUserId;
	}
	
	public void setAccessUserId(Integer accessUserId) {
		this.accessUserId = accessUserId;
	}
	
	public User getAccessUser()
	{
		return accessUser;
	}
	
	public void setAccessUser(User accessUser) {
		this.accessUser = accessUser;
	}
	
	public DocShare getDocShare()
	{
		return docShare;
	}
	
	public void setDocShare(DocShare docShare) {
		this.docShare = docShare;
	}
	
	public DocAuth getAuthMask()
	{
		return authMask;
	}
	
	public void setAuthMask(DocAuth authMask) {
		this.authMask = authMask;
	}
	
	public String getRootDocPath()
	{
		return rootDocPath;
	}
	
	public void setRootDocPath(String rootDocPath) {
		this.rootDocPath = rootDocPath;
	}
	
	public String getRootDocName()
	{
		return rootDocName;
	}
	
	public void setRootDocName(String rootDocName) {
		this.rootDocName = rootDocName;
	}
	
}
