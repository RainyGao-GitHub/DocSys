package com.DocSystem.common.entity;

public class RemoteStorage {

	public String protocol;
	public String rootPath;	//remote root path
	public Integer autoPull;
	public boolean autoPullForce = false;
	public Integer autoPush;
	public boolean autoPushForce = false;
	public SftpConfig SFTP;
	public FtpConfig FTP;
	public SmbConfig SMB = null;
	public SvnConfig SVN = null;
	public GitConfig GIT = null;
	public boolean isVerRepos = false;

}
