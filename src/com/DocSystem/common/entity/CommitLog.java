package com.DocSystem.common.entity;

public class CommitLog {
	public String id;			//uniqueId [commitId-reposId]

	public Long startTime;			//startTime
	public Long endTime;		//endTime
	
	public String ip;			//IP for commit Request
	
	public Integer userId;		//commit User ID
	public String userName;		//commit User Name
	
	public Long commitId;		//commitId [commit's init time]
	public String commitMsg;	//commit Message
	public String commitUsers;	//Users who involved in this commit
		
	public Integer reposId;		//reposId 
	public String reposName;	//reposName
	
	public String verReposInfo;			//verReposInfo (url/user/pwd)
	public Integer verReposStatus;	//status for verReposCommit: 200:成功, -1:失败，0:没有提交  revision:成功时写入, errorInfo:提交失败的信息
	public String verReposRevision;		//revision of this verReposCommit
	public String verReposErrorInfo;	//errorInfo of this verReposCommit
}
