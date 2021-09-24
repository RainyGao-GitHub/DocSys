package com.DocSystem.common.entity;

public class RemoteBackupConfig {
	public String protocol;
	public String rootPath;	//remote root path
	public SftpConfig SFTP = null;
	public FtpConfig FTP = null;
	public SmbConfig SMB = null;
	public SvnConfig SVN = null;
	public GitConfig GIT = null;
	public boolean isVerRepos = false;
	public MxsDocConfig MXSDOC = null;
	
	public Integer realTimeBackupEn = 0; //默认不进行实时备份
	public Integer fullBackupEn = 0;	//默认增量备份（如果是版本仓库或者MxsDoc仓库该标记无效）	
}
