package com.DocSystem.common.entity;

import java.util.List;

import com.DocSystem.entity.Doc;

public class LargeFileScanTask {
	public String id;			// storageType + reposId + path or  storageType + path
	
	public String storageType;	//disk / repos
	public Integer reposId;		//For repos
	public String localDiskPath;//For disk
	public String path;			//pathForScan
	
	public Long createTime;		//task create time
	
	public boolean stopFlag = false;
	public int status;	//200: success -1: failed others: in progress
	public String info;	//status info

	public List<Doc> result;	//result

	public long sizeThreshold = 100*1024*1024;	//大文件门限值
	public int count;	//已扫描文件个数
	public int largeFileCount;	//大文件个数

	public String currentScanFolder;	//当前正在扫描的路径

}
