package com.DocSystem.entity;

import java.io.Serializable;

import com.DocSystem.common.SyncLock;

public class OfficeEditLock implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -5064183009607702364L;

	public Integer id;

	public Integer type;

	public String name;	//lock name

	public Integer state; 

	public String locker = null;

    public Integer lockBy = null;

    public Long lockTime = null;
    
    public SyncLock synclock = null;

	public String server;

	public Long createTime;

	public String info;	//lock info for debug
}
