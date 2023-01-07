package com.DocSystem.common;

public class LongBeatCheckAction {

	public String key;
	public String filePath;	//the file need to be check
	public long preSize = 0L;
	public int checkCount = 0;
	public long startTime; //启动时间
	public long duration;  //超时时长: 默认一小时
	public boolean stopFlag;
}
