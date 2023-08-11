package com.DocSystem.common.entity;

public class SystemLog {

	public String id;
	public Long time;
	public String ip;
	public String userId;
	public String userName;
	public String event;
	public String subEvent;
	public String action;
	public String result;
	public String reposName;
	public String path;
	public String name;
	public String newPath;
	public String newName;
	public String content;
	public String queryId;	//For User query, defined by user
	public String commitInfo;	//版本提交记录(版本仓库地址/账户/密码/commitId) 
}
