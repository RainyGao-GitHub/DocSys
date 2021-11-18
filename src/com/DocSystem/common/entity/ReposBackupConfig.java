package com.DocSystem.common.entity;

import java.util.List;

public class ReposBackupConfig {
	public Integer backupTime;
	public List<Integer> backupDateList;
	public BackupConfig localBackupConfig;
	public BackupConfig remoteBackupConfig;
}
