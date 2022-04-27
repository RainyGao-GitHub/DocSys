package com.DocSystem.common;

public class ReposData {
	//仓库基本信息
	public Integer reposId;
	
	//线程锁
	public Object syncLockForSvnCommit; //用于svnCommit
	public Object syncLockForGitCommit; //用于gitCommit
}
