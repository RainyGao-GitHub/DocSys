package com.DocSystem.common;

public class License {
	public Integer type;	//证书类型 0:开源版 1:商业版
	public Integer usersCount; //最大用户个数
	public Long expireTime; //过期时间
	public Boolean hasLicense; //是否有证书
	public String customer;
	public Long createTime; //创建时间	
}
