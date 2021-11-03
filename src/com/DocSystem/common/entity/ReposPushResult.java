package com.DocSystem.common.entity;

import java.util.List;

import com.DocSystem.entity.Repos;

public class ReposPushResult {
	public Integer successCount;
	public Integer failCount;
	public Integer totalCount;
	public List<Repos> reposList;	
}
