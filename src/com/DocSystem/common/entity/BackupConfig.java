package com.DocSystem.common.entity;

import java.io.Serializable;

public class BackupConfig  implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -3661781575183787382L;
	public RemoteStorageConfig remoteStorageConfig;
	public Integer fullBackupEn = 0;
	public Integer realTimeBackup;
	public Integer backupTime;
	public Integer weekDay1;
	public Integer weekDay2;
	public Integer weekDay3;
	public Integer weekDay4;
	public Integer weekDay5;
	public Integer weekDay6;
	public Integer weekDay7;
	public String indexLibBase;	
}
