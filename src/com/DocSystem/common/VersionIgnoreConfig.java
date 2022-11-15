package com.DocSystem.common;

import java.io.Serializable;
import java.util.concurrent.ConcurrentHashMap;

public class VersionIgnoreConfig  implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -5731720057465271497L;
	public ConcurrentHashMap<String, Integer> versionIgnoreHashMap = null;
}
