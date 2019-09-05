package com.DocSystem.common;

public class DocSysConfig {
    private String defaultReposStorePath = null;	//仓库默认存储路径
    
    public void setDefaultReposStorePath(String defaultReposStorePath) {
		this.defaultReposStorePath = defaultReposStorePath;
	}
	
	public String getDefaultReposStorePath()
	{
		return defaultReposStorePath;
	}
}
