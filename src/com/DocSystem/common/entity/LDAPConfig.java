package com.DocSystem.common.entity;

import java.util.Map;

import com.alibaba.fastjson.JSONObject;

public class LDAPConfig {
	public String name;				//domainName
	public String url;
	public String basedn;
	public String authentication; 	//simple, GSSAPI
	public String loginMode;		//用于查询用户的属性(loginMode=userName将和filter一起作为查询条件)
	public String userAccount;		//LDAP管理员账号
	public String userPassword;		//LDAP管理员的密码
	public String filter;  			//过滤条件
	public JSONObject settings;		//用于存储额外的配置（包括属性映射表）
	public String[] attributes;					//需要读取的用户属性
	public Map<String, String> attributesMap;	//属性映射表(mxsdoc和ldap用户属性隐射关系)
}
