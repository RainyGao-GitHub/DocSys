package com.DocSystem.common;

import java.util.concurrent.ConcurrentHashMap;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;

public class FolderUploadAction {
	public String actionId;

	public String event;
	public String subEvent;
	public String eventName;
	public String queryId;
	
	public String requestIP;

	public User user;

	public Repos repos;			
	public Doc doc;				//folder doc
	public Integer docLockType;	//docLockType
	public String info; //用于lockDoc的备注
	
	public String uploadLogPath; //存放subDocs upload info，上传结束时要写入系统日志中
	public String localChangesRootPath; //上传成功的文件	
	
	public long startTime;
	public long beatTime;	//心跳时间
	public long beatStopThreshold = 3*60*1000; //默认3分钟
	
	public ConcurrentHashMap<String, LongBeatCheckAction> longBeatCheckList;	//长心跳检测列表（分片上传的分片组合，checkDocInfo时的copySameDoc）

	//count info
	public int totalCount;
	public int successCount;
	public int failCount;
	public boolean isEnd = true; //默认是true, 当totalCount无法预知时，需要先设置成false (例如后台推送)

	public boolean isCriticalError = false;
	public String errorInfo;

	public boolean stopFlag = false;
	public long stopTime;
	
	//MxsDoc系统的commitId
	public Long commitId;
	public String commitMsg;
	public String commitUser;	
}
