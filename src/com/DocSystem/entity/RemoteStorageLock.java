package com.DocSystem.entity;

public class RemoteStorageLock {	
	
	public Integer id;

	public Integer type;

	public String name;	//lock name

	public Integer state; 

	public String locker = null;

    public Integer lockBy = null;

    public Long lockTime = null;
    
    public Object synclock = null;
}