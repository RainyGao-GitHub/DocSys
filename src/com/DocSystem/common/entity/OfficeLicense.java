package com.DocSystem.common.entity;

public class OfficeLicense {

	public Integer count;
	public Integer type;
	public Integer packageType;
	public Integer mode;
	public Boolean branding;
	public Integer connections;
	public Boolean customization;
	public Integer usersCount;
	public Integer usersExpire;
	public Boolean hasLicense;
	public Boolean plugins;
	public Boolean light;
	public Long expireTime;

	//purchase info
	public String customer;
	public Long createTime;
	public String payInfo;
	public String id;
	
	public Integer state; //证书状态 0:已作废
}
