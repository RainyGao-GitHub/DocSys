package com.DocSystem.common.entity;

import java.util.List;

import com.DocSystem.common.CommitAction.CommitAction;

public class DocPushResult {
	public Integer successCount;
	public Integer failCount;
	public Integer totalCount;
	public List<CommitAction> actionList;	
	public boolean isSubAction = false;
	public CommitAction action; //latest add commitAction
	public String revision;	//svn和git会设置
	public Object synclock;
	public long retrySleepTime = 3*60*1000;	//3*60秒
	public int threadCount = 0;
	public int maxThreadCount = 10;
	public String msgInfo; //错误信息
	
	public void setError(String errmsg){
		if(this.msgInfo == null)
		{
			this.msgInfo = errmsg;
			return;
		}
		
		if(errmsg != null && errmsg.length() < 10000)
		{
			this.msgInfo = errmsg + "\n" + this.msgInfo;
		}
	}
}
