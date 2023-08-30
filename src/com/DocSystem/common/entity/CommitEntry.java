package com.DocSystem.common.entity;

public class CommitEntry {

	public String id;			//uniqueId for commitEntry [commitId-docId]
	
	public Long startTime;		//startTime
	public Long endTime;		//endTime
	
	public String ip;			//IP for commit Request
	
	public Integer userId;		//commit User ID
	public String userName;		//commit User Name
	
	public Long commitId;		//commitId [commit's init timestamp]
	public String commitMsg;	//commit Message
	public String commitUsers;	//Users who involved in this commit

	public String commitAction;			//addDoc/deleteDoc/copyDoc/moveDoc/updateDoc/uploadDoc/saveDoc
	public String realCommitAction;		//add/delete/modify/noChange/move/copy/filetodir/dirtofile	//add和modify并不影响历史文件获取，但是会影响显示
	
	public Integer reposId;		//reposId 
	public String reposName;	//reposName
	public Long docId;			//commitEntry DocId
	public String path;			//commitEntryPath
	public String name;			//commitEntryName
	public Integer isSrcEntry;	//For copy/move/renameDoc used to mark the entry is srcEntry or not
}
