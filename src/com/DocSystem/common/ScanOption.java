package com.DocSystem.common;

import java.util.HashMap;

public class ScanOption {

	public int scanType;

	public long scanTime;
	
	public String localChangesRootPath = null;	//本地改动的文件节点存储根路径
	public HashMap<Long, DocChange> localChanges = null;

	public String remoteChangesRootPath = null; //改动的文件节点存储根路径
	public HashMap<Long, DocChange> remoteChanges = null; 
}
