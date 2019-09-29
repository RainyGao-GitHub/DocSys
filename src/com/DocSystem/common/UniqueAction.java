package com.DocSystem.common;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

public class UniqueAction {
	private boolean isRunning = false;
    private Long expireTimeStamp = null; 	//超时时间戳
	
    private ConcurrentHashMap<Long, CommonAction> uniqueCommonActionHashMap = new ConcurrentHashMap<Long, CommonAction>();
    private List<CommonAction> uniqueCommonActionList = new ArrayList<CommonAction>();
	
	public boolean getIsRunning()
	{
		return isRunning;
	}
	
	public void setIsRunning(boolean isRunning) {
		this.isRunning = isRunning;
	}
	
	public Long getExpireTimeStamp()
	{
		return expireTimeStamp;
	}
	
	public void setExpireTimeStamp(Long expireTimeStamp) {
		this.expireTimeStamp = expireTimeStamp;
	}
	
	
	public void setUniqueCommonActionHashMap(ConcurrentHashMap<Long, CommonAction> uniqueCommonActionHashMap) {
		this.uniqueCommonActionHashMap = uniqueCommonActionHashMap;
	}
	
	public ConcurrentHashMap<Long, CommonAction> getUniqueCommonActionHashMap()
	{
		return uniqueCommonActionHashMap;
	}
	
	public void setUniqueCommonActionList(List<CommonAction> uniqueCommonActionList) {
		this.uniqueCommonActionList = uniqueCommonActionList;
	}
	
	public List<CommonAction> getUniqueCommonActionList()
	{
		return uniqueCommonActionList;
	}
}
