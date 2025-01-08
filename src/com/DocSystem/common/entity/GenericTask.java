package com.DocSystem.common.entity;

import java.util.concurrent.ScheduledFuture;

public class GenericTask {
	public Long createTime;
	public boolean stopFlag = false;
	public ScheduledFuture<?> scheduledFuture;
}
