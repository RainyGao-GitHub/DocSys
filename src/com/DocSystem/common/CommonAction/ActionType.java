package com.DocSystem.common.CommonAction;

public enum ActionType {
	UNDEFINED,
	FS,			
	VERREPOS,
	DB,
	INDEX,
	AUTOSYNCUP,
	VFS;		//Doc的VirtualDoc操作（如果Doc是目录，则会操作其子目录的VirtualDoc，操作完后会提交至VerRepos）
}