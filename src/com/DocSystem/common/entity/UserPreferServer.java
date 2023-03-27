package com.DocSystem.common.entity;

public class UserPreferServer {
	public String id; //userId + serverUrl.hashCode + createTime 
	
	//UserInfo
	public Integer userId;	//
	public String userName; //
	
	//ServerInfo
	public String serverType;	//MxsDoc/FTP/SFTP/SMB/GIT/SVN
	public String serverName;	//For display
	public String serverUrl;	//http://IP:port/DocSystem ftp://IP:port/path 
	public String serverUserName;
	public String serverUserPwd;
	
	public Long createTime;
	
	//用于和RemoteStorageConfig兼容
	public String url;	//For mxsdoc\git\svn		
	public String host;	//For ftp/sftp/smb
	public Integer port; //For ftp/sftp/smb
	public String charset;	//For ftp
	public Integer passiveMode;	//For ftp 被动模式 0: 否 1: 是

	public Integer isRemote; //For git/svn
	public String localVerReposPath; //For git
	public String serverUserDomain; //For smb
}

