package com.DocSystem.common.entity;

import java.util.ArrayList;
import java.util.List;

public class SystemLDAPConfig 
{
	public boolean enabled;
	public List<LDAPConfig> ldapConfigList;
	
	public SystemLDAPConfig()
	{
		enabled = false;
		ldapConfigList = new ArrayList<LDAPConfig>();
	}
}
