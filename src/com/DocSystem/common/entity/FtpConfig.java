package com.DocSystem.common.entity;

import java.io.Serializable;

public class FtpConfig  implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -8912283217670240659L;
	public String userName;
	public String pwd;
	public String host;
	public Integer port;
	public String charset;
	public Boolean isPassive;
}
