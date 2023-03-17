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
	public String rootPath;	//可選
	public String options; //更多選項
	public Long createTime;
}
