package com.DocSystem.common;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

public class FolderUploadAction {
	public String actionId;

	public String event;
	public String subEvent;
	public String eventName;
	
	public String requestIP;

	public User user;

	public Repos repos;			
	public Doc doc;				//folder doc
	public Integer docLockType;	//docLockType

	//Following data is for folderUpload
	public String commitMsg;
	public String commitUser;
	
	public String uploadLogPath; //存放subDocs upload info，上传结束时要写入系统日志中
	public String localChangesRootPath; //上传成功的文件	
	
	public long startTime;
	public long beatTime;	//心跳时间
	public long beatStopThreshold = 3*6*1000; //默认3分钟
	public int longBeatThreadCount = 0;	//长心跳线程个数（分片上传的分片组合，checkDocInfo时的copySameDoc）
	
	//count info
	public int totalCount;
	public int successCount;
	public int failCount;


	
	public boolean isCriticalError = false;
	public String errorInfo;

	public boolean stopFlag = false;
	public long stopTime;
}
