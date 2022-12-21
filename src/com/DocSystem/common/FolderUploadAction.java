package com.DocSystem.common;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

public class FolderUploadAction {
	public String actionId;
	
	public String requestIP;

	public Repos repos;			
	public Doc doc;				//folder doc
	public Integer docLockType;	//docLockType

	public User user;

	public String commitMsg;
	public String commitUser;

	public String uploadLogPath; //存放subDocs upload info，上传结束时要写入系统日志中
	public String localChangesRootPath; //上传成功的文件	
	
	public boolean isCriticalError = false;
	public String errorInfo;

	public long startTime;
	public long beatTime;	//心跳时间（心跳停跳检测3分钟，但是checkDocInfo的大文件copy时间可能比较长，如何处理呢）
	public long beatStopThreshold = 3*6*1000; //默认3分钟
	public boolean beatCheckIgnore = false;
	
	//used for systemLog
	public String event;
	public String subEvent;
	public String eventName;

	//count info
	public int totalCount;
	public int successCount;
	public int failCount;

	public boolean stopFlag = false;
}
