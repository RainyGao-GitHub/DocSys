package com.DocSystem.common.entity;

import com.DocSystem.entity.Repos;

public class ReposFullBackupTask {
	public String id;
	
	public String info = "备份中...";

	public Long createTime;

	public String backupTime;
	
	public String requestIP;
	
	public boolean stopFlag = false;
	
	public Repos repos;
	public ReposAccess reposAccess;

	public String backupStorePath;
	
	public int status;  //1:备份中 2:备份成功 3:备份失败
	
	public String targetPath;
	public String targetName;

	public long targetSize;


}
