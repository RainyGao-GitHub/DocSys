package com.DocSystem.common;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import com.DocSystem.common.CommonAction.CommonAction;

public class UniqueAction {
	private boolean isRunning = false;
    private Long expireTimeStamp = null; 	//超时时间戳
	
    //List用来保证顺序执行
    private List<CommonAction> uniqueCommonActionList = new ArrayList<CommonAction>();
    //HashMap用来保证没有重复的操作
    private ConcurrentHashMap<String, CommonAction> uniqueCommonActionHashMap = new ConcurrentHashMap<String, CommonAction>();
	
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
	
	
	public void setUniqueCommonActionHashMap(ConcurrentHashMap<String, CommonAction> uniqueCommonActionHashMap) {
		this.uniqueCommonActionHashMap = uniqueCommonActionHashMap;
	}
	
	public ConcurrentHashMap<String, CommonAction> getUniqueCommonActionHashMap()
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
