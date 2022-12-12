package com.DocSystem.common.CommonAction;

public enum Action {
	UNDEFINED,
	ADD,
	DELETE,
	UPDATE,
	MOVE,
	COPY,
	PUSH,
	SYNC_ALL, 				//同步远程存储、版本仓库、刷新索引（包括子目录）
	SYNC_ALL_FORCE, 		//同步远程存储、版本仓库、刷新索引（包括子目录）
	SYNC_VerRepos, 			//只同步版本仓库
	SYNC_VerReposAndIndex; 	//只同步版本仓库和索引（远程拉取时调用）	
}
