package com.DocSystem.common.entity;

import com.alibaba.fastjson.JSONObject;

public class LDAPConfig {
	public Boolean enabled;
	public String url;
	public String basedn;
	public JSONObject settings;
	public Integer authMode;
	public String loginMode;	//用户名字段属性
	public String userAccount;	//直接指定LDAPConnect使用的account
	public String filter;
}
