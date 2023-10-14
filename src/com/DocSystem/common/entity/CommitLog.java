package com.DocSystem.common.entity;

public class CommitLog {
	public String id;			//uniqueId [commitId-reposId]
	
	public Integer type;		//0: RealDocHistory 1:VirtualDocHistory 2:LocalBackupHistory 3: RemoteBackupHistory 4:RecycleBinHistory
	
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
	
	//path/name用于标记此次commit的根目录(例如:回收站/实时备份)
	public String docPath;			//doc's path
	public String docName;			//doc's name
	public Integer docType;			//1: File 2: Folder
	public Long docSize;			//Folder size is 0	
	
	//History Storage Info
	public String verReposInfo;			//verReposInfo (url/user/pwd)/Disk/FTP/SFTP/SMB/MxsDoc
	public Integer verReposStatus;		//status for verReposCommit: 200:成功, -1:失败，0:没有提交  revision:成功时写入, errorInfo:提交失败的信息
	public String verReposOffsetPath;	//OffsetPath for History (历史可以不放在根目录)
	public String verReposRevision;		//revision of this verReposCommit (如果不是verRepos可以是空)
	public String verReposErrorInfo;	//errorInfo of this verReposCommit

}
