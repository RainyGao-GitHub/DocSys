package com.DocSystem.common.entity;

public class LongTermTask {
	public String id;
	
	public String queryId;
	public String event;
	public String eventName;
	public Long createTime;
	
	public boolean stopFlag = false;
	public int status;	//200: success -1: failed others: in progress
	public String info;	//status info
}
