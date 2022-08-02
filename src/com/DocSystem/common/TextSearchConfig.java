package com.DocSystem.common;

import java.util.concurrent.ConcurrentHashMap;

public class TextSearchConfig {
	public Boolean enable = false;
	public ConcurrentHashMap<String, Integer> realDocTextSearchDisableHashMap = null;	
	public ConcurrentHashMap<String, Integer> virtualDocTextSearchDisablehHashMap = null;	
	public ConcurrentHashMap<String, Integer> docNameTextSearchDisableHashMap = null;	
}
