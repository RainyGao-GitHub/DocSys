package com.DocSystem.common.entity;

public class License {
	public String id;	//licenseId

	public Integer type;	//证书类型  0:开源版  1:企业版 2:专业版 3:个人版
	public Integer count; //最大安装设备数
	public Integer usersCount; //最大用户个数
	public Long expireTime; //过期时间
	public Boolean hasLicense; //是否有证书
	
	//purchase info
	public String customer;
	public String payInfo;
	public Long createTime; //创建时间	

	public String installedMacList;	//已安装MAC列表
	public Integer installedCount; //已安装设备数

	public Integer state; //证书状态 0:已作废
}
