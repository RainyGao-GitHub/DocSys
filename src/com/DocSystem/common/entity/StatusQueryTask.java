package com.DocSystem.common.entity;

public class StatusQueryTask {
	public String id;
	
	public String queryId;
	public String event;
	public String eventName;
	public Long createTime;
	
	public boolean stopFlag = false;
	public int status;
	public String info;
}
