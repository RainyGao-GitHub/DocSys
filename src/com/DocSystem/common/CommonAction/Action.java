package com.DocSystem.common.CommonAction;

public enum Action {
	UNDEFINED,
	ADD,
	DELETE,
	UPDATE,
	MOVE,
	COPY,
	PUSH,
	SYNC, //同步版本仓库、刷新索引（包括子目录）
	SYNCFORCE, //同步版本仓库、刷新索引（包括子目录）
	SYNCVerRepos; //同步版本仓库
}
