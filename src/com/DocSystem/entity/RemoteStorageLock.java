package com.DocSystem.entity;

import java.io.Serializable;

public class RemoteStorageLock  implements Serializable {	
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 7436064038303366230L;

	public Integer id;

	public Integer type;

	public String name;	//lock name

	public Integer state; 

	public String locker = null;

    public Integer lockBy = null;

    public Long lockTime = null;
    
    public Object synclock = null;
}