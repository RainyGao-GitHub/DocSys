package com.DocSystem.common.entity;

import com.alibaba.fastjson.JSONObject;

public class LDAPConfig {
	public Boolean enabled;
	public String url;
	public String basedn;
	public JSONObject settings;
	public String authentication; //simple, GSSAPI
	public Integer authMode;	//密码模式
	public String loginMode;	//用户名字段属性
	public String userAccount;	//LDAP管理员账号（如果指定了，则使用该用户鉴权）
	public String userPassword;	//LDAP管理员的密码
	public String filter;  		//过滤条件
}
