package com.DocSystem.common.entity;

import java.util.List;

public class BackupConfig {
	public Integer backupTime;
	public List<Integer> backupDateList;
	public LocalBackupConfig localBackupConfig;
	public RemoteBackupConfig remoteBackupConfig;
}
