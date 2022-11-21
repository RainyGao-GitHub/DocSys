package com.DocSystem.common.entity;

import java.io.Serializable;

public class ReposBackupConfig implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -2817746653999472624L;
	public String checkSum;	//For cluster deploy usage
	public BackupConfig localBackupConfig;
	public BackupConfig remoteBackupConfig;
}
