package com.DocSystem.common;

public class FolderUploadAction {
	public boolean isCriticalError;
	public String errorInfo;
	public long startTime;
	public long beatTime;	//心跳时间（心跳停跳检测3分钟，但是checkDocInfo的大文件copy时间可能比较长，如何处理呢）
	public String uploadLogPath; //存放subDocs upload info，上传结束时要写入系统日志中
	public String actionId;
}
