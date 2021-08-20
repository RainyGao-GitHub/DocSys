package com.DocSystem.common;

public class RemoteStorage {

	public String protocol;
	public Integer autoPull;
	public boolean autoPullForce = false;
	public Integer autoPush;
	public boolean autoPushForce = false;
	public SftpConfig SFTP;
	public FtpConfig FTP;
	public String rootPath;
}
