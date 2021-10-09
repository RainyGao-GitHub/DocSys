package com.DocSystem.common.entity;

public class RemoteBackupConfig 
{
	public Integer realTimeBackupEn = 0; //默认不进行实时备份
	public Integer fullBackupEn = 0;	//默认增量备份（如果是版本仓库或者MxsDoc仓库该标记无效）	
	public RemoteStorageConfig remoteStorageConfig;
}
