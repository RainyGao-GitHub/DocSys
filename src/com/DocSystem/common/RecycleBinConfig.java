package com.DocSystem.common;

import java.io.Serializable;

public class RecycleBinConfig implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5704793689380198280L;
	
	public String checkSum; //For cluster deploy usage
	public Boolean enable = false;
}
