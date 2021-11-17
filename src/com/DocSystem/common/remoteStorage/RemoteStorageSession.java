package com.DocSystem.common.remoteStorage;

public class RemoteStorageSession 
{
	public String protocol;
	public SFTPUtil sftp;
	public FtpUtil ftp;
	public SmbUtil smb;
	public SvnUtil svn;
	public GitUtil git;
	public MxsDocUtil mxsdoc;
	public String authCode;
	public boolean indexUpdateEn = true;
}
