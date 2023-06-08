package com.DocSystem.common.entity;

import java.io.Serializable;

public class ReposSyncupConfig  implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -2224227367593807212L;
	public String checkSum;	//For cluster deploy usage
	public VerReposSyncupConfig verReposSyncupConfig;
	public RemoteStorageSyncupConfig remoteStorageSyncupConfig;	
}
