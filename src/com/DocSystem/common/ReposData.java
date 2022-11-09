package com.DocSystem.common;

public class ReposData {
	//仓库基本信息
	public Integer reposId;
	
	public String disabled = null;	//仓库禁用时设置
	public Boolean isBusy = false;
		
	//线程锁
	public Object syncLockForSvnCommit; //用于svnCommit
	public Object syncLockForGitCommit; //用于gitCommit

	public Object syncLockForDocNameIndex;	//用于docNameIndex
	public Object syncLockForRDocIndex; //用于RealDocIndex
	public Object syncLockForVDocIndex; //用于VirtualDocIndex
}
