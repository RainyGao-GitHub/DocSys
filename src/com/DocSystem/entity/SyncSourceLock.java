package com.DocSystem.entity;

import java.io.Serializable;

import com.DocSystem.common.SyncLock;

public class SyncSourceLock implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -8988973478839398727L;
	
	public String sourceName;	//syncSourceName
	
	public Integer id;			//LockId

	public Integer type;	

	public String name;			//lock name

	public Integer state; 

	public String locker = null;

    public Integer lockBy = null;

    public Long lockTime = null;
    
    public SyncLock synclock = null;

	public String server;

	public Long createTime;

	public String info;	//lock info for debug

}
