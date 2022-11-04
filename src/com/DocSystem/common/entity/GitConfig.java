package com.DocSystem.common.entity;

import java.io.Serializable;

public class GitConfig  implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -7874135180881477237L;
	public Integer isRemote;
	public String userName;
	public String pwd;
	public String privateKey;
	public String url;
	public String localVerReposPath;
}
