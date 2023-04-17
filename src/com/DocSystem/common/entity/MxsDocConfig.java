package com.DocSystem.common.entity;

import java.io.Serializable;

public class MxsDocConfig  implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -4287780604192046378L;
	public String userName;
	public String pwd;
	public String url;
	public Integer reposId;
	public String remoteDirectory;
	public String authCode;	//用于本地服务器（不会出现在配置文件中）
}
