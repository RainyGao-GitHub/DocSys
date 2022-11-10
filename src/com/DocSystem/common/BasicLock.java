package com.DocSystem.common;

import java.io.Serializable;

public class BasicLock implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 7826391354845461438L;
	
	public Long expireTime = null;	//过期时间（锁定时长）
	
	public String locker = null; //锁定者
}
