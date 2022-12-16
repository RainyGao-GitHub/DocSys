package com.DocSystem.common.CommonAction;

public enum Action {
	UNDEFINED,
	ADD,
	DELETE,
	UPDATE,
	MOVE,
	COPY,
	PUSH,
	SYNC_ALL, 					//同步版本仓库、同步远程存储、强行刷新SearchIndex
	SYNC_ALL_FORCE, 			//同步版本仓库，同步远程存储、强行刷新SearchIndex
	SYNC_AUTO, 					//同步版本仓库、同步远程存储（会更新文件索引）
	SYNC_VerRepos,				//同步版本仓库（只是为了弥补文件操作版本提交失败的情况）
	SYNC_RemoteStorage,			//同步远程存储（自动拉取）
	SYNC_SearchIndex;
}
