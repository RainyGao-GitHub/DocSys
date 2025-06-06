package com.DocSystem.common.entity;

import com.alibaba.fastjson.JSONObject;

public class LLMConfig
{
	public String name;				//LLM Name
	public String url;				//LLM Server URL
	public String apikey;			//LLM API Access Key
	public JSONObject settings;		//用于存储额外的配置（包括属性映射表）
}
