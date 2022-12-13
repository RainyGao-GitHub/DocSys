package com.DocSystem.common.CommonAction;

public enum Action {
	UNDEFINED,
	ADD,
	DELETE,
	UPDATE,
	MOVE,
	COPY,
	PUSH,
	SYNC_ALL, 					//同步远程存储、版本仓库、强行刷新索引   （包括子目录）
	SYNC_ALL_FORCE, 			//同步远程存储、版本仓库、强行刷新索引   （包括子目录）
	SYNC_AUTO, 					//同步远程存储、版本仓库、不更新索引（包括子目录），不更新索引是为了保证性能
	SYNC_AfterRevertHistory,	//同步版本仓库、更新有改动文件的索引（禁用远程拉取，避免恢复的文件被覆盖）
	SYNC_AfterRemoteStoragePull,//同步版本仓库、更新有改动文件的索引（禁用远程拉取和推送，已经是最新的了）
	SYNC_NotDefined;

}
