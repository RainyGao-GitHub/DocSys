package com.DocSystem.common.entity;

public class PreferLink {

	public String id;

	public String name;
	public String url;
	public String content;
	public Integer type;

	public Integer userId;
	public String userName;

	public String accessUserIds;	//users who can access the preferLink
	public String accessGroupIds;	//groups which can access the preferLink

	public Long createTime;
}
