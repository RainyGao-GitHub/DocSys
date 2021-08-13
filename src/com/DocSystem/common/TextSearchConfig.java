package com.DocSystem.common;

import java.util.concurrent.ConcurrentHashMap;

public class TextSearchConfig {
	public Boolean isReposTextSearchDisable;
	public ConcurrentHashMap<String, String> realDocTextSearchDisableHashMap = null;	
	public ConcurrentHashMap<String, String> virtualDocTextSearchDisablehHashMap = null;	
	public ConcurrentHashMap<String, String> docNameTextSearchDisableHashMap = null;	
}
