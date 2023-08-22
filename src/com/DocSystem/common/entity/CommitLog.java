package com.DocSystem.common.entity;

public class CommitLog {

	public String id;			//commitId
	public Long time;			//startTime
	public Long endTime;		//endTime
	public String ip;			//IP for commit Request
	public String userId;		//commit User ID
	public String userName;		//commit User Name
	public String commitMsg;	//commit Message
	public String commitUsers;	//Users who involved in this commit
	
	public String result;		//commit Result
	
	public Integer reposId;		//reposId 
	public String reposName;	//reposName
	
	public String verReposInfo;		//Version Repository Info (url/user/pwd)
	public String verReposRevision;	//Revision in Version Repository for this commit
}
