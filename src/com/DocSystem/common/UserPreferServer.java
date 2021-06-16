package com.DocSystem.common;

public class UserPreferServer {
	public String id; //userId + serverUrl.hashCode + createTime 
	
	//UserInfo
	public Integer userId;	//
	public String userName; //
	
	//ServerInfo
	public String serverName;
	public String serverUrl;
	public String serverUserName;
	public String serverUserPwd;
	public Long createTime;
}
