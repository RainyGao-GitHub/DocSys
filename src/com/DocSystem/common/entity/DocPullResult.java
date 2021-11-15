package com.DocSystem.common.entity;

import java.util.List;

import com.DocSystem.entity.Doc;

public class DocPullResult {
	public Integer successCount;
	public Integer failCount;
	public Integer totalCount;
	public List<Doc> successDocList;
}
