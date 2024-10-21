package com.DocSystem.common.entity;

import com.DocSystem.entity.Doc;

public class RemoteDocumentEditTask 
{
	public String id;			//TODO: Office在线编辑任务ID: 应该需要是可推导的（建议用 docId来表示）
	
	public Integer reposId;		//TODO: 用于RemoteOfficeEdit的仓库 
	public String rootPath;		//TODO: 用于存放文件的根路径
	
	public Doc doc;				//TODO: 文件信息
	
	public Long createTime;		//task create time
	public long expireTime;		//task expire time

	public String fileLink;		//TODO: 文件下载地址
	public String saveFileLink;	//TODO: 文件保存地址
	
	public boolean stopFlag = false;
	public int status;	//200: success -1: failed others: in progress
	public String info;	//status info

}
