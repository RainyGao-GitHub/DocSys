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
		
	public Integer reposId;		//reposId 
	public String reposName;	//reposName
	
	public String verReposInfo;			//verReposInfo (url/user/pwd)
	public Integer verReposStatus = 0;	//status for verReposCommit: 200:成功, -1:失败，0:没有提交  revision:成功时写入, errorInfo:提交失败的信息
	public String verReposRevision;		//revision of this verReposCommit
	public String verReposErrorInfo;	//errorInfo of this verReposCommit
}
