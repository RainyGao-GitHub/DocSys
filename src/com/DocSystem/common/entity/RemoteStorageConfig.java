package com.DocSystem.common.entity;

public class RemoteStorageConfig {

	public String protocol;
	public String rootPath;	//remote root path
	public Integer autoPull = 0;
	public Integer autoPullForce = 0;
	public Integer autoPush = 0;
	public Integer autoPushForce = 0;
	public SftpConfig SFTP;
	public FtpConfig FTP;
	public SmbConfig SMB = null;
	public SvnConfig SVN = null;
	public GitConfig GIT = null;
	public boolean isVerRepos = false;
	public MxsDocConfig MXSDOC;
	public String remoteStorageIndexLib;
	

}
