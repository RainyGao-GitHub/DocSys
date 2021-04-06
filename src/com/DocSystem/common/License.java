package com.DocSystem.common;

public class License {
	public Integer type;	//证书类型 0:开源版 1:商业版
	public Integer usersCount; //最大用户个数
	public Long expireTime; //过期时间
	public Boolean hasLicense; //是否有证书
	
	//purchase info
	public String id;
	public String customer;
	public String payInfo;
	public Long createTime; //创建时间	

	public Integer state; //证书状态 0:已作废
}
