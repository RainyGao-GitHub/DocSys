package com.DocSystem.common.CommonAction;

public enum ActionType {
	UNDEFINED,
	FS,			 //Doc的RealDoc和VirtualDoc的add/delete/update/copy/move
	VERREPOS,	 //Doc的RealDoc和VritualDoc的版本的Commit(add/delete/update)/Copy/Move/Push
	DB,			 //Doc的RealdDoc的DBEntry add/delete/update
	SearchIndex, //Doc的DocName/RealDoc/VDoc/ALL 搜索索引的add/delete/update
	AUTOSYNCUP,	 //Doc的同步（版本仓库同步、远程存储同步、搜索索引刷新）
	VFS;		 //Doc的VirtualDoc add/delete/update/copy/move 似乎和FS重复了（如果Doc是目录，则会操作其子目录的VirtualDoc，操作完后会提交至VerRepos）
}