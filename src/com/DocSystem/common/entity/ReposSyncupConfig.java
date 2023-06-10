package com.DocSystem.common.entity;

import java.io.Serializable;

public class ReposSyncupConfig  implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -2224227367593807212L;
	public String checkSum;	//For cluster deploy usage
	public AutoTaskConfig autoTaskConfig;	//TODO: 自动同步时间配置
	public VerReposSyncupConfig verReposSyncupConfig;
	public RemoteStorageSyncupConfig remoteStorageSyncupConfig;	
	public SearchIndexSyncupConfig searchIndexSyncupConfig;	
}
