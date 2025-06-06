package com.DocSystem.common.entity;

import java.util.ArrayList;
import java.util.List;

public class SystemLLMConfig 
{
	public boolean enabled;
	public List<LLMConfig> llmConfigList;
	
	public SystemLLMConfig()
	{
		enabled = false;
		llmConfigList = new ArrayList<LLMConfig>();
	}
}
