package com.DocSystem.common;

public class ReposData {
	//仓库基本信息
	public Integer reposId;
	
	public String disabled = null;	//仓库禁用时设置
	public Boolean isBusy = false;
		
	//线程锁
	public Object syncLockForSvnCommit; //用于svnCommit
	public Object syncLockForGitCommit; //用于gitCommit
}
