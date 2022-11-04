package com.DocSystem.common;

import java.io.Serializable;
import java.util.concurrent.ConcurrentHashMap;

public class TextSearchConfig  implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -1899770164996730777L;
	public Boolean enable = false;
	public ConcurrentHashMap<String, Integer> realDocTextSearchDisableHashMap = null;	
	public ConcurrentHashMap<String, Integer> virtualDocTextSearchDisablehHashMap = null;	
	public ConcurrentHashMap<String, Integer> docNameTextSearchDisableHashMap = null;
	public String checkSum;	
}
