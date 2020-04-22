package com.DocSystem.common;

import com.DocSystem.entity.User;

public class AuthCode {
	private String code = null; //hashCode for authCode
	private String usage = null;	//用途
    private Long expTime = null;	//超时时间戳
	private Integer remainCount = 1; //默认只能使用一次
	private ReposAccess reposAccess = null;	//用途
    
	public String getCode()
	{
		return code;
	}
	
	public void setCode(String code) {
		this.code = code;
	}
	
	public String getUsage()
	{
		return usage;
	}
	
	public void setUsage(String usage) {
		this.usage = usage;
	}
	
	public Long getExpTime()
	{
		return expTime;
	}
	
	public void setExpTime(Long expTime) {
		this.expTime = expTime;
	}
	
	public Integer getRemainCount()
	{
		return remainCount;
	}
	
	public void setRemainCount(Integer remainCount) {
		this.remainCount = remainCount;
	}
	
	public ReposAccess getReposAccess()
	{
		return reposAccess;
	}
	
	public void setReposAccess(ReposAccess reposAccess) {
		this.reposAccess = reposAccess;
	}
}
